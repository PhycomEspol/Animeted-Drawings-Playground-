import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Helper to wait for one of multiple selectors
async function waitForAnySelector(page: Page, selectors: string[], timeout = 5000): Promise<string | null> {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return selector;
    } catch (e) {
      // Continue to next selector
    }
  }
  return null;
}

async function maybeClickAccept(page: Page): Promise<void> {
  const modalAcceptButtonSelector = 'div.modal-footer button:has-text("Accept")';
  const genericAcceptButtonSelector = 'button:has-text("Accept")';

  try {
    // Prioritize checking for the specific modal
    const specificModalFooterSelector = 'div.modal-footer.pb-4';
    const specificModalFooterVisible = await page.isVisible(specificModalFooterSelector, { timeout: 1000 });

    if (specificModalFooterVisible) {
      console.log('Specific modal with footer "div.modal-footer.pb-4" detected.');
      await page.waitForSelector(modalAcceptButtonSelector, { state: 'visible', timeout: 1000 });
      console.log('Found "Accept" button within the specific modal, clicking it...');
      await page.click(modalAcceptButtonSelector);
      console.log('Specific modal "Accept" button clicked.');
      await page.waitForTimeout(1000); // Wait for potential UI transitions after click
    } else {
      // If the specific modal is not visible, try the generic accept button
      await page.waitForSelector(genericAcceptButtonSelector, { state: 'visible', timeout: 1000 });
      console.log('No specific modal detected. Found generic "Accept" button, clicking it...');
      await page.click(genericAcceptButtonSelector);
      console.log('Generic "Accept" button clicked.');
      await page.waitForTimeout(1000); // Wait for potential UI transitions after click
    }
  } catch (e) {
    console.log('No "Accept" button (specific or generic) found or visible within the timeout.');
  }
}

export async function runSketchAutomation(
  inputPath: string,
  outputPath: string,
  demoIndex: number = 0
): Promise<string> {
  let browser: Browser | null = null;
  try {
    console.log('Launching browser...');
    // Use PLAYWRIGHT_HEADLESS env var to control mode (default: true for headless)
    const isHeadless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    const slowMo = isHeadless ? 0 : 500;
    browser = await chromium.launch({ headless: isHeadless, slowMo });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to Meta Sketch...');
    await page.goto('https://sketch.metademolab.com/canvas');

    await maybeClickAccept(page); // Check for accept button before navigation
    await maybeClickAccept(page); // Check for accept button again after navigation

    // 1. Upload Image
    // The "Upload Photo" button triggers a file chooser dialog
    // We need to intercept it with fileChooser and set the file
    console.log('Uploading image...');
    const uploadButtonSelector = 'button:has-text("Upload Photo")';
    await page.waitForSelector(uploadButtonSelector, { state: 'visible' });
    
    // Start waiting for file chooser before clicking the button
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click(uploadButtonSelector)
    ]);
    await fileChooser.setFiles(inputPath);
    console.log('Image uploaded via file chooser.');

    // 2. Click "Next" buttons
    // The flow usually involves: Upload -> Next (Scan) -> Next (Mask) -> Next (Joints) -> Animation
    // We try to click "Next" repeatedly until we see the animation canvas or demo buttons.
    console.log('Navigating wizard steps...');
    
    // Set up early interception for get_animation endpoint (before navigation)
    let getAnimationId: string | null = null;
    let resolveGetAnimationId: ((value: string) => void) | null = null;
    const getAnimationIdPromise = new Promise<string>(resolve => {
      resolveGetAnimationId = resolve;
    });

    page.on('response', async (response) => {
      if (response.url().includes('get_animation') && response.status() === 200) {
        try {
          // The endpoint returns a plain text string ID, not JSON
          const responseBody = await response.text();
          if (responseBody && responseBody.trim()) {
            getAnimationId = responseBody.trim();
            if (resolveGetAnimationId) {
              resolveGetAnimationId(getAnimationId);
            }
            console.log('Intercepted get_animation response. ID:', getAnimationId);
          } else {
            console.warn('get_animation response body was empty');
          }
        } catch (e) {
          console.error('Failed to parse get_animation response:', e);
        }
      }
    });
    
    // Potential selectors for "Next" button
    const nextButtonSelectors = [
      'button:has-text("Next")',
      '[data-testid="next-button"]', 
      '.next-btn' 
    ];

    // Navigate through wizard steps until we reach the animation selection page
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
        // Wait for UI to settle
        await page.waitForTimeout(2000); 

        // Check if we've reached the final step by looking for "Add animation" text
        const pageText = await page.textContent('body');
        const isAnimationPage = pageText && pageText.includes('Add animation');
        
        if (isAnimationPage) {
            console.log('Reached animation selection page (found "Add animation" text).');
            
            // Click a random animation from the grid container
            const gridContainer = await page.$('.grid-container');
            if (gridContainer) {
                // Wait for grid items to fully populate (fixes race condition in headless mode)
                await page.waitForTimeout(1500);
                
                // Use specific selector to target only clickable animation items (divs containing images)
                const gridItems = await gridContainer.$$('div:has(img)');
                if (gridItems.length > 0) {
                    // Pick a random child div to click
                    const randomIndex = Math.floor(Math.random() * gridItems.length);
                    console.log(`Clicking random animation (index ${randomIndex} of ${gridItems.length})...`);
                    await gridItems[randomIndex].click();
                    await page.waitForTimeout(1000); // Wait for animation to load
                } else {
                    console.log('No items found in grid container.');
                }
            } else {
                console.log('Grid container not found.');
            }
            break; // Exit the loop, we're done navigating
        }
        
        // Not at final step yet - try to find and click the "Next" button
        const nextBtn = await page.$(nextButtonSelectors[0]);
        if (nextBtn && await nextBtn.isVisible() && await nextBtn.isEnabled()) {
            console.log(`Clicking Next (attempt ${i + 1})...`);
            await nextBtn.click();
            continue;
        }

        // If no Next button found and not at animation page, log and continue
        console.log(`Attempt ${i + 1}: No Next button found, waiting...`);
    }

    // After all navigation steps, ensure getAnimationId is available
    console.log('Waiting for animation ID from get_animation endpoint...');
    if (!getAnimationId) {
      getAnimationId = await getAnimationIdPromise;
    }
    if (!getAnimationId) {
      throw new Error('Failed to retrieve animation ID from "get_animation" endpoint.');
    }

    // 3.6. Extract gif_name from the selected animation
    const selectedItem = await page.$('.item-grid-selected img');
    if (!selectedItem) {
      throw new Error('No selected animation found with class "item-grid-selected".');
    }
    const imgSrc = await selectedItem.getAttribute('src');
    if (!imgSrc) {
      throw new Error('Selected animation image has no src attribute.');
    }
    const match = imgSrc.match(/\/([a-zA-Z0-9_-]+)\.\w+\.gif$/);
    if (!match || !match[1]) {
      throw new Error(`Could not extract gif_name from src: ${imgSrc}`);
    }
    const gifName = match[1];

    const finalVideoUrl = `https://production-sketch-video.metademolab.com/${getAnimationId}/${gifName}.mp4`;
    // Also construct GIF URL (same pattern but .gif extension)
    const finalGifUrl = `https://production-sketch-video.metademolab.com/${getAnimationId}/${gifName}.gif`;
    
    console.log(`Final video URL: ${finalVideoUrl}`);
    console.log(`Final GIF URL: ${finalGifUrl}`);

    // 3. Wait for Animation to be ready
    console.log('Waiting for animation to render...');
    await page.waitForTimeout(5000); // Give it time to generate

    // 4. Select Demo if requested (Not fully implemented - just assuming default for now or finding buttons)
    // If there are buttons to switch animations, click them here based on demoIndex.
    
    // 5. Download the MP4 video file to a temp location
    console.log('Downloading animation MP4...');
    const mp4TempPath = outputPath.replace(/\.(gif|webp)$/i, '.mp4');
    
    try {
      const response = await fetch(finalVideoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download MP4: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(mp4TempPath, buffer);
      console.log(`MP4 saved to: ${mp4TempPath}`);

      // 6. Convert MP4 to WebP with cropping and transparent background
      console.log('Converting MP4 to WebP with transparent background...');
      const { convertMp4ToGif } = await import('./videoConverter');
      const outputFilePath = await convertMp4ToGif(mp4TempPath, mp4TempPath, {
        // Crop pixels from each edge - these values should be visible in the output
        cropTop: 100,
        cropBottom: 100,
        cropLeft: 50,
        cropRight: 50,
        width: 480,
        fps: 15,
        // Remove the off-white background and output as WebP for full alpha support
        removeBackground: true,
        outputFormat: 'webp'
      });
      console.log(`WebP created: ${outputFilePath}`);
      
      // Optionally delete the temp MP4 file
      fs.unlinkSync(mp4TempPath);
      console.log(`Deleted temp MP4: ${mp4TempPath}`);
      
    } catch (downloadError) {
      console.error('Failed to download/convert video, taking screenshot as fallback:', downloadError);
      // Fallback to screenshot with .png extension
      const pngOutputPath = outputPath.replace(/\.(gif|webp)$/i, '.png');
      const canvasElement = await page.$('canvas');
      if (canvasElement) {
        await canvasElement.screenshot({ path: pngOutputPath });
      } else {
        await page.screenshot({ path: pngOutputPath });
      }
    }

    console.log('Done.');
    return finalVideoUrl;

  } catch (error) {
    console.error('Playwright error:', error);
    if (browser) await browser.close();
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
