const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const sanitize = require("sanitize-filename");
const json2csv = require("json2csv").parse;
const userAgent = require("user-agents");
const fs = require("fs");

puppeteer.use(StealthPlugin());
const BASE_URL = "https://twitter.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36";

class Scraper {
  constructor(username, password, query) {
    // Configurações do usuário
    this.user = username;
    this.pass = password;
    this.query = query;

    // Configurações do raspador
    this.agent = (
      userAgent
      .random()
      .toString()
    ) || USER_AGENT;
    this.headless = false;
    this.latest = true;
    this.delay = 5000;
    this.random_delay = 1000;
    this.max_retries = 5;
    this.url = `${BASE_URL}/search?q=${this.query}`;
    this.scrapedList = [];

    // Configurações da interface
    fs.readFile("ascii_title.txt", "utf8", (err, data) => {
      if (err) {
        console.error("Error while reading file:", err);
        return;
      }
      console.log(data);
    });

    // Execução
    this.run().catch((err) => {
      if (this.max_retries > 0) {
        setTimeout(() => {
          this.run();
          console.log("Falha de conexão. Tentando novamente...");
        }, 30000);
        this.max_retries--;
      } else {
        console.log("Erro ao executar o scraper...");
        console.error(err);
      }
    });
  }

  async run() {
    const browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=1920,1080",
      ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(this.agent);
    await page.setJavaScriptEnabled(true);
    await page.goto(`${BASE_URL}/i/flow/login`, {
      waitUntil: "domcontentloaded",
    });
    await this.login_handler(page);
    console.log("Conexão Estabelecida. ");
    console.log("Iniciando a busca... ");
    await this.search_handler(page);
    await page.waitForSelector('article[data-testid="tweet"]', {
      timeout: 60000,
    });
    await this._fetch(page);
    console.log("Coleta terminada!");
    browser.close();
  }

  async _fetch(page) {
    let lastTweet = null;
    while (true) {
      const tweets = await page.$$('article[data-testid="tweet"]');
      const data = [];
      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        const user = await tweet.evaluate((node) =>
          Array.from(node.querySelectorAll('div[data-testid="User-Name"] span'))
            .filter((span) => span.textContent.includes("@"))
            .map((span) => span.textContent)
            .join("")
        );
        const tweet_text = await tweet.evaluate(
          (node) =>
            node.querySelector('div[data-testid="tweetText"]').textContent
        );
        const datetime = await tweet.evaluate((node) =>
          node
            .querySelector('div[data-testid="User-Name"] a[dir="ltr"] time')
            .getAttribute("datetime")
        );
        const replies = await tweet.evaluate((node) => {
          const div = node.querySelector('div[data-testid="reply"]');
          return div ? parseInt(div.textContent) || 0 : 0;
        });
        const retweets = await tweet.evaluate((node) => {
          const div = node.querySelector('div[data-testid="retweet"]');
          return div ? parseInt(div.textContent) || 0 : 0;
        });
        const likes = await tweet.evaluate((node) => {
          const div = node.querySelector('div[data-testid="like"]');
          return div ? parseInt(div.textContent) || 0 : 0;
        });
        const source = await tweet.evaluate(
          (node) =>
            node.querySelector('div[data-testid="User-Name"] a[dir="ltr"]').href
        );
        if (!this.scrapedList.includes(source)) {
          this.scrapedList.push(source);
          data.push({
            user,
            tweet_text,
            replies,
            retweets,
            likes,
            datetime,
            source,
          });
          let formattedUser =
            user.length >= 20 ? user.substring(0, 20) : user.padEnd(20, " ");
          console.log(
            `Coletado de ${formattedUser} Total: ${this.scrapedList.length}`
          );
        }
        lastTweet = tweet;
      }

      // Solução do Copilot pq eu não estava muito satisfeito com a paginação anterior
      if (lastTweet) {
        await page.evaluate((node) => node.scrollIntoView(), lastTweet);
        // Wait for new tweets to load
        await page.evaluate(() => {
          return new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
              for (let mutation of mutations) {
                if (
                  mutation.type === "childList" &&
                  mutation.addedNodes.length > 0
                ) {
                  observer.disconnect();
                  resolve();
                  return;
                }
              }
            });
            observer.observe(
              document.querySelector('div[data-testid="primaryColumn"]'),
              { childList: true, subtree: true }
            );
          });
        });
      }

      if (data.length !== 0) {
        this.saveJsonToCsv(data);
        await new Promise((resolve) =>
          setTimeout(resolve, this.delay + this.random_delay * Math.random())
        );
      } else {
        break;
      }
    }
  }

  async search_handler(page) {
    await page.waitForSelector('input[placeholder="Search"]');
    await page.type('input[placeholder="Search"]', this.query);
    await page.keyboard.press("Enter");
    if (this.latest) {
      await page.waitForSelector('div[role="tablist"] a[href$="&f=live"]');
      await this.clickButton(page, 'div[role="tablist"] a[href$="&f=live"]');
    }
  }

  async clickButton(page, selector) {
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  async login_handler(page) {
    console.log("Conectando... ");
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', this.user);
    await this.clickButton(
      page,
      'div[style="background-color: rgb(239, 243, 244); border-color: rgba(0, 0, 0, 0);"]'
    );
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', this.pass);
    await this.clickButton(page, 'div[data-testid="LoginForm_Login_Button"]');
  }

  saveJsonToCsv(data) {
    try {
      const safeFilename = sanitize(`${this.query}`);
      let csv;
      if (!fs.existsSync(`${safeFilename}.csv`)) {
        csv = json2csv(data);
      } else {
        csv = json2csv(data, { header: false });
      }
      fs.appendFileSync(`${safeFilename}.csv`, csv + "\n");
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = Scraper;