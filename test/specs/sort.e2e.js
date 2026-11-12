const Page_Url = 'https://rippsam.github.io/sportsEquip/index.html?dept=5'

const Sort_options = [
    { key: 'default', label: 'Featured' },
    { key: 'price-asc', label: 'Price: Low to High' },
    { key: 'price-desc', label: 'Price: High to Low' },
    { key: 'name-asc', label: 'Name: A → Z' },
    { key: 'name-desc', label: 'Name: Z → A' },
    { key: 'on-sale', label: 'On sale' },
    { key: 'new', label: 'New arrivals' }
]

async function openPage() {
    await browser.url(Page_Url)
    await $('#sort-btn').waitForClickable({ timeout: 150000})
    // wait for the first products to finish loading before using the sort menu
    await browser.waitUntil(async () => (await $$('.pcard').length) > 0, {
        timeout: 150000,
        timeoutMsg: 'products never showed up on the page'
    })
}

async function chooseSort(key) {
    await $('#sort-btn').click()
    await $(`.sort-option[data-sort="${key}"]`).click()
    await browser.waitUntil(async () => {
        const countText = await $('#filter-results-count').getText()
        const cards = await $$('.pcard').length
        return countText !== '' && cards === parseInt(countText)
    }, { timeout: 150000, timeoutMsg: 'products never loaded' })
}

async function getPrices() {
    const prices = []
    for (const el of await $$('.pcard-price')) {
        const text = await el.getText()
        prices.push(parseFloat(text.replace('$', '')))
    }
    return prices
}

async function getNames() {
    const names = []
    for (const el of await $$('.pcard-name')) {
        names.push(await el.getText())
    }
    return names
}

async function getBadges() {
    const badges = []
    for (const card of await $$('.pcard')) {
        const badge = await card.$('.pcard-badge')
        badges.push(await badge.isExisting() ? await badge.getText() : '')
    }
    return badges
}

describe('Sort menu', () => {

    it('lists all 7 sort options in order', async () => {
        await openPage()
        const options = await $$('.sort-option')
        expect(options.length).toBe(Sort_options.length)

        for (let i = 0; i < Sort_options.length; i++) {
            await expect(options[i]).toHaveAttribute('data-sort', Sort_options[i].key)
            expect(await options[i].getProperty('textContent')).toBe(Sort_options[i].label)
        }
    })

    it('opens the dropdown when the sort button is clicked', async () => {
        await openPage()
        await expect($('#sort-dropdown')).not.toHaveElementClass('open')
        await $('#sort-btn').click()
        await expect($('#sort-dropdown')).toHaveElementClass('open')
    })

    it('selects an option from the dropdown', async () => {
        await openPage()
        await $('#sort-btn').click()
        await $('.sort-option[data-sort="price-asc"]').click()
        await expect($('#sort-selected-text')).toHaveText('Price: Low to High')
        await expect($('#sort-dropdown')).not.toHaveElementClass('open')
    })

    it('sorts by price low to high', async () => {
        await openPage()
        await chooseSort('price-asc')

        const prices = await getPrices()
        for (let i = 0; i < prices.length - 1; i++) {
            expect(prices[i]).toBeLessThanOrEqual(prices[i + 1])
        }
    })

    it('sorts by price high to low', async () => {
        await openPage()
        await chooseSort('price-desc')
        await expect($('#sort-selected-text')).toHaveText('Price: High to Low')

        const prices = await getPrices()
        for (let i = 0; i < prices.length - 1; i++) {
            expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1])
        }
    })

    it('sorts by name A to Z', async () => {
        await openPage()
        await chooseSort('name-asc')
        await expect($('#sort-selected-text')).toHaveText('Name: A → Z')

        const names = await getNames()
        for (let i = 0; i < names.length - 1; i++) {
            const result = names[i].toLowerCase().localeCompare(names[i + 1].toLowerCase())
            expect(result).toBeLessThanOrEqual(0)
        }
    })

    it('sorts by name Z to A', async () => {
        await openPage()
        await chooseSort('name-desc')
        await expect($('#sort-selected-text')).toHaveText('Name: Z → A')

        const names = await getNames()
        for (let i = 0; i < names.length - 1; i++) {
            const result = names[i].toLowerCase().localeCompare(names[i + 1].toLowerCase())
            expect(result).toBeGreaterThanOrEqual(0)
        }
    })

    it('on sale puts sale items first', async () => {
        await openPage()
        await chooseSort('on-sale')
        await expect($('#sort-selected-text')).toHaveText('On sale')

        const badges = await getBadges()
        const firstNotSale = badges.findIndex(b => b !== 'Sale')
        if (firstNotSale !== -1) {
            expect(badges.slice(firstNotSale)).not.toContain('Sale')
        }
    })

    it('new arrivals puts new items first', async () => {
        await openPage()
        await chooseSort('new')
        await expect($('#sort-selected-text')).toHaveText('New arrivals')

        const badges = await getBadges()
        const firstNotNew = badges.findIndex(b => b !== 'New')
        if (firstNotNew !== -1) {
            expect(badges.slice(firstNotNew)).not.toContain('New')
        }
    })
})

