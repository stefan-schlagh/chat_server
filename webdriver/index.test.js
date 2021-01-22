const {Builder, By, Key, until,Capabilities} = require('selenium-webdriver');
const fs = require('fs');
require('selenium-webdriver/chrome');

const rootURL = 'http://localhost:80';

const chromeCapabilities = Capabilities.chrome();
const  chromeOptions = {
    'args': ['--headless','--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--disable-extensions']
};
chromeCapabilities.set('chromeOptions', chromeOptions);
const d = new Builder().withCapabilities(chromeCapabilities).build();

const waitUntilTime = 20000;
let driver, el, actual, expected;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5;

//https://medium.com/@mathieux51/jest-selenium-webdriver-e25604969c6

it('waits for the driver to start', () => {
    return d.then(_d => {
        driver = _d
    })
});

it('initialises the context', async () => {
    await driver.get(rootURL)
});

it('should login',async () => {
    await driver.wait(until.elementLocated(By.name('username')), 10000);
    await driver.findElement(By.name('username')).sendKeys('stefan', Key.RETURN);
    await driver.findElement(By.name('password')).sendKeys('password', Key.RETURN);
});

it('should click on chat',async () => {
    //wait until chats loaded
    await driver.wait(until.elementLocated(By.className('chat-item')),10000);
    //const chatList = await driver.findElements(By.className('chat-item'));
});

afterAll(async () => {
    await driver.quit();
});