class BaseScraper {
  async search(page, query) {
    throw new Error("Метод search(page, query) должен быть переопределен.");
  }

  async parseProduct(page, url) {
    throw new Error("Метод parseProduct(page, url) должен быть переопределен.");
  }
}

module.exports = BaseScraper;