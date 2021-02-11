const {Builder, By, Key, until,Capabilities} = require('selenium-webdriver');
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

const messages = [
    'test 1111',
    'test 2222'
]

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

it('should wait until chats loaded',async () => {
    //wait until chats loaded
    await driver.wait(until.elementLocated(By.className('chat-item')), 10000);
});
it('should click on chat of user 123',async () => {

    const chatList = await driver.findElements(By.className('chat-item'));

    let foundUser123 = false;
    let usernameItem;
    for (let i = 0; i < chatList.length; i++) {
        // get username item
        const usernameItemA = await chatList[i].findElements(By.className('chatItem-username'));
        // findElements should return a array with length 1
        expect(usernameItemA.length).toEqual(1);
        usernameItem = usernameItemA[0];
        // get username text
        const usernameText = await usernameItem.getText();
        expect(typeof usernameText).toBe('string');
        // compare username
        if (usernameText === 'user123') {
            foundUser123 = true;
            break;
        }
    }
    // user should have been found
    expect(foundUser123).toEqual(true);
    //click on usernameItem
    await usernameItem.click();

});
it('should wait until message loaded',async () => {
    //wait until message loaded
    await driver.wait(until.elementLocated(By.className('msg-container')), 10000);
});
it('should send messages',async () => {
    // get message form
    const msgForm = await driver.findElement(By.className('msg-form'));
    // get message input
    const msgInput = await msgForm.findElement(By.name('message-input-text'));
    // set text and send by pressing enter
    await msgInput.sendKeys(messages[0],Key.RETURN);
    //set text and press send button
    await msgInput.sendKeys(messages[1]);
    await msgForm.findElement(By.className('btn-submit')).click();
});
it('should find message',async () => {

    const chatContainer = await driver.findElement(By.className('chat-container'));
    const messageContainer = await chatContainer.findElement(By.className('messages'));
    const messageElements = await messageContainer.findElements(By.className('msg-container'));

    let foundMessage = false;
    for (let i = messageElements.length - 1; i >= 0; i--) {
        // get message item
        const messageItem = await messageElements[i].findElement(By.className('content'));
        const text = await messageItem.getText();

        if(text.includes(messages[0]))
            foundMessage = true;
    }
    expect(foundMessage).toEqual(true);
});

afterAll(async () => {
    await driver.quit();
});