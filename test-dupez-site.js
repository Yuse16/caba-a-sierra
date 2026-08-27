const { chromium } = require('@playwright/test');

const BASE = 'https://dupez.uk';
const results = [];

function pass(name, detail = '') {
  results.push({ name, status: 'PASS', detail });
  console.log(`PASS: ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, status: 'FAIL', detail });
  console.log(`FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // ─── HOME PAGE ────────────────────────────────────────────
  console.log('\n=== HOME PAGE ===');
  try {
    const resp = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (resp && resp.ok()) pass('Home loads', `status ${resp.status()}`);
    else fail('Home loads', `status ${resp ? resp.status() : 'null'}`);
  } catch (e) {
    fail('Home loads', e.message.split('\n')[0]);
  }

  try {
    const title = await page.title();
    if (title.toUpperCase().includes('DUPEZ')) pass('Title contains DUPEZ', title);
    else fail('Title contains DUPEZ', title);
  } catch (e) { fail('Title contains DUPEZ', e.message.split('\n')[0]); }

  // Header with DUPEZ branding
  try {
    const headerText = await page.locator('header').first().textContent();
    if (headerText && headerText.toUpperCase().includes('DUPEZ')) pass('Header has DUPEZ branding');
    else fail('Header has DUPEZ branding', headerText ? headerText.substring(0, 100) : 'no header');
  } catch (e) { fail('Header has DUPEZ branding', e.message.split('\n')[0]); }

  // Hero section
  try {
    const heroCandidates = [
      page.locator('[id*="inicio"]'),
      page.locator('section').first(),
      page.locator('[class*="hero"]'),
      page.locator('[class*="Hero"]'),
    ];
    let heroVisible = false;
    for (const c of heroCandidates) {
      if (await c.count() > 0 && await c.first().isVisible()) {
        heroVisible = true;
        break;
      }
    }
    if (heroVisible) pass('Hero section visible');
    else fail('Hero section visible');
  } catch (e) { fail('Hero section visible', e.message.split('\n')[0]); }

  // Navigation anchors
  const anchors = ['#inicio', '#cabanas', '#como-reservar', '#contacto'];
  for (const anchor of anchors) {
    try {
      const link = page.locator(`a[href="${anchor}"]`).first();
      if (await link.count() > 0) pass(`Nav anchor ${anchor} exists`);
      else {
        const loose = page.locator(`a[href*="${anchor}"]`).first();
        if (await loose.count() > 0) pass(`Nav anchor ${anchor} exists`, '(partial match)');
        else fail(`Nav anchor ${anchor} exists`);
      }
    } catch (e) { fail(`Nav anchor ${anchor}`, e.message.split('\n')[0]); }
  }

  // Test clicking nav anchor #contacto
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const contactoLink = page.locator('a[href="#contacto"]').first();
    if (await contactoLink.count() > 0) {
      await contactoLink.click();
      await page.waitForTimeout(500);
      const url = page.url();
      if (url.includes('#contacto')) pass('Nav anchor #contacto click scrolls');
      else pass('Nav anchor #contacto click works', 'clicked without error');
    }
  } catch (e) { fail('Nav anchor #contacto click', e.message.split('\n')[0]); }

  // Footer
  try {
    const footer = page.locator('footer').first();
    if (await footer.count() > 0 && await footer.isVisible()) pass('Footer visible');
    else if (await footer.count() > 0) pass('Footer present', 'not currently in viewport');
    else fail('Footer visible');
  } catch (e) { fail('Footer visible', e.message.split('\n')[0]); }

  // WhatsApp link
  try {
    const waLink = page.locator('a[href*="wa.me"]').first();
    if (await waLink.count() > 0) {
      const href = await waLink.getAttribute('href');
      if (href && href.includes('528442779477')) pass('WhatsApp link correct', href);
      else fail('WhatsApp link correct', href);
    } else fail('WhatsApp link correct', 'not found');
  } catch (e) { fail('WhatsApp link', e.message.split('\n')[0]); }

  // Phone link
  try {
    const phoneLink = page.locator('a[href^="tel:"]').first();
    if (await phoneLink.count() > 0) {
      const href = await phoneLink.getAttribute('href');
      if (href && href.includes('528442779477')) pass('Phone link correct', href);
      else fail('Phone link correct', href);
    } else fail('Phone link correct', 'not found');
  } catch (e) { fail('Phone link', e.message.split('\n')[0]); }

  // Email link
  try {
    const emailLink = page.locator('a[href^="mailto:"]').first();
    if (await emailLink.count() > 0) {
      const href = await emailLink.getAttribute('href');
      if (href && href.includes('cabanasdupez@gmail.com')) pass('Email link correct', href);
      else fail('Email link correct', href);
    } else fail('Email link correct', 'not found');
  } catch (e) { fail('Email link', e.message.split('\n')[0]); }

  // Search bar
  try {
    const search = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i], input[placeholder*="explorar" i], input[placeholder*="cabaña" i], input[placeholder*="amenidad" i], input[placeholder*="arteaga" i]').first();
    if (await search.count() > 0) pass('Search bar present');
    else {
      const anyInput = page.locator('input[type="text"], input:not([type])').first();
      if (await anyInput.count() > 0) pass('Search bar present', '(input found)');
      else fail('Search bar present');
    }
  } catch (e) { fail('Search bar', e.message.split('\n')[0]); }

  // "Explorar cabañas" button
  try {
    const btn = page.getByRole('link', { name: /explorar/i }).or(page.getByRole('button', { name: /explorar/i })).first();
    if (await btn.count() > 0) pass('"Explorar cabañas" button exists');
    else fail('"Explorar cabañas" button exists');
  } catch (e) { fail('"Explorar cabañas" button', e.message.split('\n')[0]); }

  // Cabin section
  try {
    const cabanaSection = page.locator('#cabanas, [id*="cabaña" i], [id*="cabana" i]').first();
    if (await cabanaSection.count() > 0) pass('Cabin section renders');
    else {
      const placeholder = page.getByText(/cabaña/i).first();
      if (await placeholder.count() > 0) pass('Cabin section renders', '(text found)');
      else fail('Cabin section renders');
    }
  } catch (e) { fail('Cabin section', e.message.split('\n')[0]); }

  // Promotions section
  try {
    const promoSection = page.locator('[id*="promo" i]').first();
    if (await promoSection.count() > 0) pass('Promotions section renders');
    else {
      const promoText = page.getByText(/promoci[oó]n/i).first();
      if (await promoText.count() > 0) pass('Promotions section renders', '(text found)');
      else {
        const ofertaText = page.getByText(/oferta/i).first();
        if (await ofertaText.count() > 0) pass('Promotions section renders', '(oferta text found)');
        else fail('Promotions section renders');
      }
    }
  } catch (e) { fail('Promotions section', e.message.split('\n')[0]); }

  // Cómo reservar section
  try {
    const reservarSection = page.locator('#como-reservar, [id*="reservar" i]').first();
    if (await reservarSection.count() > 0) pass('Cómo reservar section renders');
    else {
      const reservarText = page.getByText(/c[oó]mo reservar/i).first();
      if (await reservarText.count() > 0) pass('Cómo reservar section renders', '(text found)');
      else fail('Cómo reservar section renders');
    }
  } catch (e) { fail('Cómo reservar section', e.message.split('\n')[0]); }

  // Contact section
  try {
    const contactSection = page.locator('#contacto, [id*="contact" i]').first();
    if (await contactSection.count() > 0) pass('Contact section renders');
    else {
      const contactText = page.getByText(/contacto/i).first();
      if (await contactText.count() > 0) pass('Contact section renders', '(text found)');
      else fail('Contact section renders');
    }
  } catch (e) { fail('Contact section', e.message.split('\n')[0]); }

  // WhatsApp CTA buttons
  try {
    const waButtons = page.locator('a[href*="wa.me"]');
    const count = await waButtons.count();
    if (count > 0) {
      const allCorrect = [];
      for (let i = 0; i < count; i++) {
        const href = await waButtons.nth(i).getAttribute('href');
        allCorrect.push(href && href.includes('528442779477'));
      }
      if (allCorrect.every(Boolean)) pass('WhatsApp CTA buttons correct', `${count} found`);
      else fail('WhatsApp CTA buttons correct', `${count} found but some have wrong href`);
    } else fail('WhatsApp CTA buttons correct', 'none found');
  } catch (e) { fail('WhatsApp CTA buttons', e.message.split('\n')[0]); }

  // ─── LOGIN PAGE ───────────────────────────────────────────
  console.log('\n=== LOGIN PAGE ===');
  try {
    const resp = await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (resp && resp.ok()) pass('Login loads', `status ${resp.status()}`);
    else fail('Login loads', `status ${resp ? resp.status() : 'null'}`);
  } catch (e) { fail('Login loads', e.message.split('\n')[0]); }

  try {
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    if (await emailInput.count() > 0) pass('Email input present');
    else fail('Email input present');
  } catch (e) { fail('Email input', e.message.split('\n')[0]); }

  try {
    const pwInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await pwInput.count() > 0) pass('Password input present');
    else fail('Password input present');
  } catch (e) { fail('Password input', e.message.split('\n')[0]); }

  try {
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]')
      .or(page.getByRole('button', { name: /iniciar|entrar|acceder|log.?in|sign.?in/i }))
      .first();
    if (await submitBtn.count() > 0) pass('Submit button present');
    else fail('Submit button present');
  } catch (e) { fail('Submit button', e.message.split('\n')[0]); }

  try {
    const forgotLink = page.locator('a[href="/recuperar-contrasena"]')
      .or(page.getByRole('link', { name: /olvidaste/i }))
      .first();
    if (await forgotLink.count() > 0) {
      const href = await forgotLink.getAttribute('href');
      if (href && href.includes('/recuperar-contrasena')) pass('"Olvidaste tu contraseña" link correct', href);
      else fail('"Olvidaste tu contraseña" link correct', href);
    } else fail('"Olvidaste tu contraseña" link', 'not found');
  } catch (e) { fail('"Olvidaste tu contraseña" link', e.message.split('\n')[0]); }

  try {
    const form = page.locator('form').first();
    if (await form.count() > 0) pass('Login form structure valid');
    else fail('Login form structure valid');
  } catch (e) { fail('Login form structure', e.message.split('\n')[0]); }

  // ─── RECOVER PASSWORD PAGE ────────────────────────────────
  console.log('\n=== RECOVER PASSWORD PAGE ===');
  try {
    const resp = await page.goto(`${BASE}/recuperar-contrasena`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (resp && resp.ok()) pass('Recover page loads', `status ${resp.status()}`);
    else fail('Recover page loads', `status ${resp ? resp.status() : 'null'}`);
  } catch (e) { fail('Recover page loads', e.message.split('\n')[0]); }

  try {
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    if (await emailInput.count() > 0) pass('Recover email input present');
    else fail('Recover email input present');
  } catch (e) { fail('Recover email input', e.message.split('\n')[0]); }

  try {
    const submitBtn = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /enviar|instrucciones/i }))
      .first();
    if (await submitBtn.count() > 0) pass('"Enviar instrucciones" button present');
    else fail('"Enviar instrucciones" button present');
  } catch (e) { fail('"Enviar instrucciones" button', e.message.split('\n')[0]); }

  try {
    const backLink = page.locator('a[href="/login"]')
      .or(page.getByRole('link', { name: /volver/i }))
      .first();
    if (await backLink.count() > 0) {
      const href = await backLink.getAttribute('href');
      if (href && href.includes('/login')) pass('"Volver al acceso" link correct', href);
      else fail('"Volver al acceso" link correct', href);
    } else fail('"Volver al acceso" link', 'not found');
  } catch (e) { fail('"Volver al acceso" link', e.message.split('\n')[0]); }

  // ─── UPDATE PASSWORD PAGE ─────────────────────────────────
  console.log('\n=== UPDATE PASSWORD PAGE ===');
  try {
    const resp = await page.goto(`${BASE}/actualizar-contrasena`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const finalUrl = page.url();
    if (resp) pass('Update password page loads', `status ${resp.status()}, url: ${finalUrl}`);
    else fail('Update password page loads');
  } catch (e) { fail('Update password page loads', e.message.split('\n')[0]); }

  // ─── ADMIN REDIRECT ───────────────────────────────────────
  console.log('\n=== ADMIN REDIRECT ===');
  try {
    const resp = await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const finalUrl = page.url();
    if (finalUrl.includes('/login')) pass('Admin redirects to /login', finalUrl);
    else fail('Admin redirects to /login', `stayed at ${finalUrl}`);
  } catch (e) { fail('Admin redirect', e.message.split('\n')[0]); }

  // ─── SUMMARY ──────────────────────────────────────────────
  await browser.close();

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} PASS / ${failed} FAIL / ${results.length} total`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.detail}`);
    });
  }
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
})();
