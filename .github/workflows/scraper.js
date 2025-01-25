import puppeteer from 'puppeteer';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function scrape() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://impresapiu.subito.it/shops/46259-moto-rood-srl');
    
    const ads = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.item_list_wrapper article'));
      return items.map(item => ({
        titolo: item.querySelector('.item_title')?.innerText?.trim(),
        prezzo: item.querySelector('.price')?.innerText?.trim(),
        immagine: item.querySelector('img')?.src,
        link: item.querySelector('a')?.href
      }));
    });

    await admin.firestore()
      .collection('annunci')
      .doc('subito')
      .set({ items: ads });
      
  } catch (error) {
    console.error('Errore:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrape();
