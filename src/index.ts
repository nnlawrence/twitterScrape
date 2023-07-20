import puppeteer, { ElementHandle, Page } from 'puppeteer';
import { username, password } from './secrets';

const randomIntFromInterval = (min: number, max: number) => {
  // min inclusive and max exclusive
  return Math.floor(Math.random() * (max - min) + min);
};

const sleep_for = async (page: Page, min: number, max: number) => {
  let sleep_duration = randomIntFromInterval(min, max);
  console.log('waiting for ', sleep_duration / 1000, 'seconds');
  await page.waitForTimeout(sleep_duration); // simulate some quasi human behavior
};

interface TweetData {
  tweetName: string;
  tweetText: string;
}

const navigateToPage = async (page: Page, URL: string) => {
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep_for(page, 1000, 2000);
  const tweets = (await page.$x(
    `//article[@data-testid="tweet"]`
  )) as ElementHandle<HTMLDivElement>[];
  const lines: TweetData[] = [];
  if (tweets) {
    for (const tweet of tweets) {
      const tweetName = await getText(
        '//div[@data-testid="User-Name"]//span//span',
        tweet,
        page
      );
      const tweetText = await getText(
        '//div[@data-testid="tweetText"]',
        tweet,
        page
      );
      const tweetObject = {
        tweetName,
        tweetText
      };
      console.log(tweetObject);
      lines.push(tweetObject);
    }
  }
  return lines;
};

const authenticate = async (page: Page) => {
  try {
    const username_inputs = await page.$x(`//input[@name="text"]`);
    if (username_inputs.length > 0) {
      await username_inputs[0].focus();
      await page.keyboard.type(username);
    }
    const nextButton = (await page.$x(
      `//div[@role='button']//span[text()='Next']`
    )) as ElementHandle[];
    if (nextButton) {
      await nextButton[0].click();
    }
    await sleep_for(page, 500, 1000);
    const password_inputs = await page.$x(`//input[@name="password"]`);
    if (password_inputs.length > 0) {
      await password_inputs[0].focus();
      await page.keyboard.type(password);
    }
    const loginButton = (await page.$x(
      `//div[@role='button']//span[text()='Log in']`
    )) as ElementHandle[];
    if (loginButton) {
      await loginButton[0].click();
    }
  } catch (e) {
    console.log('Error in Auth:', e);
  }
};

const main_actual = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const URL = 'https://twitter.com/login';
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    });

    await page.goto(URL, { waitUntil: 'networkidle2' });
    await sleep_for(page, 1000, 2000);
    await authenticate(page);
    await sleep_for(page, 500, 1000);
    let lines = await navigateToPage(page, 'https://twitter.com/home');
    // console.table(lines);
  } catch (e) {
    console.log(e);
  }
};

const main = async () => {
  await main_actual();
};

const getText = async (
  xpath: string,
  elementHandle: ElementHandle<HTMLElement>,
  page: Page
) => {
  const [textHandle] = (await elementHandle.$x(
    xpath
  )) as ElementHandle<HTMLElement>[];
  let formattedText = (await page.evaluate(
    (el) => el.innerText,
    textHandle
  )) as string;
  return formattedText.replace(/(\r\n|\n|\r)/gm, ' ');
};

main();
