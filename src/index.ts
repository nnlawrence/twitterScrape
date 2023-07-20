import puppeteer, { Page } from 'puppeteer';
import { username, password } from './secrets';

const randomIntFromInterval = (min: number, max: number) => {
  // min inclusive and max exclusive
  return Math.floor(Math.random() * (max - min) + min);
};

// @ts-expect-error
let sleep_for = async (page: puppeteer.Page, min: number, max: number) => {
  let sleep_duration = randomIntFromInterval(min, max);
  console.log('waiting for ', sleep_duration / 1000, 'seconds');
  await page.waitForTimeout(sleep_duration); // simulate some quasi human behavior
};

// @ts-expect-error
let navigateToPage = async (page: puppeteer.Page, URL: string) => {
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep_for(page, 1000, 2000);
  const tweets = await page.$x(`//article[@data-testid="tweet"]`);
  let lines: string[] = [];
  if (tweets.length > 0) {
    for (let i = 0; i < tweets.length; i++) {
      let tweet = (await page.evaluate(
        (el: { innerText: any }) => el.innerText,
        tweets[i]
      )) as string;
      tweet = tweet.replace(/(\r\n|\n|\r)/gm, ' ');
      console.log(tweet);
      lines.push(tweet);
    }
  }
  return lines;
};

// @ts-expect-error
let authenticate = async (page: puppeteer.Page) => {
  try {
    const username_inputs = await page.$x(`//input[@name="text"]`);
    if (username_inputs.length > 0) {
      await username_inputs[0].focus();
      await page.keyboard.type(username);
    }
    const nextButton = await page.$x(
      `//div[@role='button']//span[text()='Next']`
    );
    if (nextButton.length > 0) {
      await nextButton[0].click();
    }
    await sleep_for(page, 500, 1000);
    const password_inputs = await page.$x(`//input[@name="password"]`);
    if (password_inputs.length > 0) {
      await password_inputs[0].focus();
      await page.keyboard.type(password);
    }
    const loginButton = await page.$x(
      `//div[@role='button']//span[text()='Log in']`
    );
    if (loginButton.length > 0) {
      await loginButton[0].click();
    }
  } catch (e) {
    console.log('Error in Auth:', e);
  }
};

//article[data-testid="tweet"]
//$x(`//article[@data-testid="tweet"]`)

let main_actual = async () => {
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
    console.table(lines);
  } catch (e) {
    console.log(e);
  }
};

let main = async () => {
  await main_actual();
};

main();
