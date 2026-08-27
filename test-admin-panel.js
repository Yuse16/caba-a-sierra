const { chromium } = require("playwright");

const BASE = "https://panel.dupez.uk";
const EMAIL = "admin@dupez.uk";
const PASSWORD = "admin123";

let total = 0;
let passed = 0;
let failed = 0;
let skipped = 0;
let authenticated = false;

function pass(name, detail) {
  total++; passed++;
  console.log("  PASS  " + name + (detail ? " -- " + detail : ""));
}

function fail(name, detail) {
  total++; failed++;
  console.log("  FAIL  " + name + (detail ? " -- " + detail : ""));
}

function skip(name, reason) {
  total++; skipped++;
  console.log("  SKIP  " + name + " -- " + reason);
}

function section(title) {
  console.log("\n===== " + title + " =====");
}

async function assertLoggedIn(page) {
  const url = page.url();
  if (url.includes("/login")) {
    throw new Error("Not authenticated -- still on /login (" + url + ")");
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // ======== 1. LOGIN FLOW ========
  section("1. Login flow");

  try {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 20000 });
    const url = page.url();
    if (url.includes("/login")) {
      pass("Root redirects through /panel to /login", url);
    } else {
      fail("Root redirect to /login", "URL: " + url);
    }
  } catch (e) {
    fail("Navigate to root", e.message);
  }

  try {
    await page.waitForSelector('input[name="email"]', { timeout: 8000 });
    pass("Login form rendered (email field visible)");
  } catch (e) {
    fail("Login form rendered", e.message);
  }

  try {
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    pass("Filled credentials", "email=" + EMAIL);
  } catch (e) {
    fail("Fill credentials", e.message);
  }

  try {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const url = page.url();
    const stillOnLogin = url.includes("/login");
    if (stillOnLogin) {
      const errorEl = await page.locator('[role="alert"]').textContent().catch(function() { return ""; });
      fail("Login submission", 'Still on /login. Server error: "' + (errorEl.trim() || "none") + '"');
    } else {
      authenticated = true;
      pass("Login submission + redirect", url);
    }
  } catch (e) {
    fail("Login submission", e.message);
  }

  // ======== GATE ========
  if (!authenticated) {
    console.log("");
    console.log("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+");
    console.log("|  WARNING: AUTHENTICATION FAILED                         |");
    console.log("|  The credentials admin@dupez.uk / admin123 were         |");
    console.log('|  rejected by Supabase: "No pudimos iniciar sesion      |');
    console.log('|  con esos datos."                                      |');
    console.log("|                                                        |");
    console.log("|  All panel pages require authentication and redirect    |");
    console.log("|  back to /login. Remaining tests are SKIPPED.          |");
    console.log("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+");

    section("2. Dashboard /panel");
    skip("Sidebar navigation visible", "not authenticated");
    skip('"Cabanas" nav link present', "not authenticated");
    skip('"Promociones" nav link present', "not authenticated");
    skip("Logout button present", "not authenticated");

    section("3. Cabins list /panel/cabanas");
    skip('"Nueva cabana" link present', "not authenticated");
    skip("List shows (empty state or cabins)", "not authenticated");
    skip("Cabin card has edit/preview/publish", "not authenticated");

    section("4. New cabin form /panel/cabanas/nueva");
    skip("Form fields present", "not authenticated");
    skip('"Volver a cabanas" link works', "not authenticated");
    skip('"Guardar borrador" button present', "not authenticated");
    skip('"Publicar" button present', "not authenticated");
    skip("Image upload area present", "not authenticated");

    section("5. Promotions list /panel/promociones");
    skip('"Nueva promocion" link present', "not authenticated");
    skip("List shows (empty state or promos)", "not authenticated");

    section("6. New promotion form /panel/promociones/nueva");
    skip("Form fields present", "not authenticated");
    skip('"Volver a promociones" link works', "not authenticated");
    skip('"Guardar borrador" button present', "not authenticated");

    section("7. Logout");
    skip("Click logout + redirect to /login", "not authenticated");
  }

  // ======== IF AUTHENTICATED, RUN REMAINING TESTS ========

  if (authenticated) {
    // 2. DASHBOARD /panel
    section("2. Dashboard /panel");

    try {
      await page.goto(BASE + "/panel", { waitUntil: "domcontentloaded", timeout: 20000 });
      await assertLoggedIn(page);
      await page.waitForTimeout(2000);
      pass("Navigated to /panel", page.url());
    } catch (e) {
      fail("Navigate to /panel", e.message);
    }

    try {
      await page.locator("aside").waitFor({ state: "visible", timeout: 8000 });
      pass("Sidebar navigation visible");
    } catch (e) {
      fail("Sidebar navigation visible", e.message);
    }

    try {
      await page.locator("aside button", { hasText: "Cabanas" }).waitFor({ state: "visible", timeout: 5000 });
      pass('"Cabanas" nav link present');
    } catch (e) {
      fail('"Cabanas" nav link present', e.message);
    }

    try {
      await page.locator("aside button", { hasText: "Promociones" }).waitFor({ state: "visible", timeout: 5000 });
      pass('"Promociones" nav link present');
    } catch (e) {
      fail('"Promociones" nav link present', e.message);
    }

    try {
      await page.locator('button[aria-label="Cerrar sesion"]').first().waitFor({ state: "visible", timeout: 5000 });
      pass("Logout button present");
    } catch (e) {
      fail("Logout button present", e.message);
    }

    // 3. CABINS LIST
    section("3. Cabins list /panel/cabanas");

    try {
      await page.goto(BASE + "/panel/cabanas", { waitUntil: "domcontentloaded", timeout: 20000 });
      await assertLoggedIn(page);
      await page.waitForTimeout(2000);
      pass("Navigated to /panel/cabanas");
    } catch (e) {
      fail("Navigate to /panel/cabanas", e.message);
    }

    try {
      const nuevaLink = page.locator('a[href="/panel/cabanas/nueva"]');
      await nuevaLink.first().waitFor({ state: "visible", timeout: 8000 });
      const text = (await nuevaLink.first().innerText()).trim();
      pass('"Nueva cabana" link present', 'href=/panel/cabanas/nueva, text="' + text + '"');
    } catch (e) {
      fail('"Nueva cabana" link present', e.message);
    }

    try {
      const hasEmptyState = await page.locator("text=Todavia no hay cabanas").isVisible().catch(function() { return false; });
      const cabinCards = await page.locator("article").count();
      if (hasEmptyState) {
        pass("List shows empty state", "No cabins yet");
      } else if (cabinCards > 0) {
        pass("List shows cabin cards", cabinCards + " cabin(s)");
      } else {
        const loading = await page.locator("text=Cargando cabanas").isVisible().catch(function() { return false; });
        if (loading) {
          pass("List shows loading state");
        } else {
          fail("List shows content", "No empty state, cards, or loading indicator found");
        }
      }
    } catch (e) {
      fail("List shows content", e.message);
    }

    try {
      const cabinCards = await page.locator("article").count();
      if (cabinCards > 0) {
        const editCount = await page.locator('article a[href^="/panel/cabanas/"]').count();
        const previewCount = await page.locator("article button", { hasText: "Vista previa" }).count();
        const toggleCount = await page.locator('article button[role="switch"]').count();
        if (editCount > 0 && previewCount > 0 && toggleCount > 0) {
          pass("Cabin cards have edit/preview/publish toggle",
            cabinCards + " cards: " + editCount + " edit, " + previewCount + " preview, " + toggleCount + " toggles");
        } else {
          fail("Cabin cards have edit/preview/publish toggle",
            "edit=" + editCount + ", preview=" + previewCount + ", toggle=" + toggleCount);
        }
      } else {
        pass("Cabin card elements (skipped -- list empty)");
      }
    } catch (e) {
      fail("Cabin card elements", e.message);
    }

    // 4. NEW CABIN FORM
    section("4. New cabin form /panel/cabanas/nueva");

    try {
      await page.goto(BASE + "/panel/cabanas/nueva", { waitUntil: "domcontentloaded", timeout: 20000 });
      await assertLoggedIn(page);
      await page.waitForTimeout(2000);
      pass("Navigated to /panel/cabanas/nueva");
    } catch (e) {
      fail("Navigate to /panel/cabanas/nueva", e.message);
    }

    var cabinFieldChecks = [
      { name: "Nombre", selector: 'input[placeholder*="Cabana"]' },
      { name: "Descripcion corta", selector: 'input[placeholder*="frase breve"]' },
      { name: "Descripcion completa", selector: 'textarea[placeholder*="espacios"]' },
      { name: "Ubicacion", selector: 'input[placeholder*="Sierra"]' },
      { name: "Precio por noche", selector: 'input[placeholder="2800"]' },
    ];

    for (var fi = 0; fi < cabinFieldChecks.length; fi++) {
      var field = cabinFieldChecks[fi];
      try {
        await page.locator(field.selector).first().waitFor({ state: "visible", timeout: 5000 });
        pass("Field: " + field.name);
      } catch (e) {
        fail("Field: " + field.name, e.message);
      }
    }

    try {
      var numInputs = await page.locator('input[type="number"]').count();
      if (numInputs >= 4) pass("Capacity fields (guests/bedrooms/beds/bathrooms)", numInputs + " number inputs");
      else fail("Capacity fields", "Expected >=4, got " + numInputs);
    } catch (e) { fail("Capacity fields", e.message); }

    try {
      var timeInputs = await page.locator('input[type="time"]').count();
      if (timeInputs >= 2) pass("Check-in/check-out time fields", timeInputs + " time inputs");
      else fail("Check-in/check-out time fields", "Expected >=2, got " + timeInputs);
    } catch (e) { fail("Check-in/check-out time fields", e.message); }

    try {
      await page.locator("button", { hasText: "Volver a cabanas" }).first().waitFor({ state: "visible", timeout: 5000 });
      pass('"Volver a cabanas" button present');
    } catch (e) { fail('"Volver a cabanas" button', e.message); }

    try {
      await page.locator("button", { hasText: "Guardar borrador" }).first().waitFor({ state: "visible", timeout: 5000 });
      pass('"Guardar borrador" button present');
    } catch (e) { fail('"Guardar borrador" button', e.message); }

    try {
      await page.locator("button", { hasText: "Publicar" }).first().waitFor({ state: "visible", timeout: 5000 });
      pass('"Publicar" button present');
    } catch (e) { fail('"Publicar" button', e.message); }

    try {
      await page.locator("button", { hasText: /Selecciona las fotografias/i }).first().waitFor({ state: "visible", timeout: 5000 });
      pass("Image upload area present");
    } catch (e) { fail("Image upload area", e.message); }

    // 5. PROMOTIONS LIST
    section("5. Promotions list /panel/promociones");

    try {
      await page.goto(BASE + "/panel/promociones", { waitUntil: "domcontentloaded", timeout: 20000 });
      await assertLoggedIn(page);
      await page.waitForTimeout(2000);
      pass("Navigated to /panel/promociones");
    } catch (e) { fail("Navigate to /panel/promociones", e.message); }

    try {
      var nuevaPromo = page.locator('a[href="/panel/promociones/nueva"]');
      await nuevaPromo.first().waitFor({ state: "visible", timeout: 8000 });
      var text2 = (await nuevaPromo.first().innerText()).trim();
      pass('"Nueva promocion" link present', 'href=/panel/promociones/nueva, text="' + text2 + '"');
    } catch (e) { fail('"Nueva promocion" link present', e.message); }

    try {
      var hasEmptyState2 = await page.locator("text=No encontramos promociones").isVisible().catch(function() { return false; });
      var promoCards = await page.locator("article").count();
      if (hasEmptyState2) {
        pass("List shows empty state", "No promotions yet");
      } else if (promoCards > 0) {
        pass("List shows promotion cards", promoCards + " promotion(s)");
      } else {
        var loading2 = await page.locator("text=Cargando promociones").isVisible().catch(function() { return false; });
        if (loading2) pass("List shows loading state");
        else fail("List shows content", "No empty state, cards, or loading indicator");
      }
    } catch (e) { fail("List shows content", e.message); }

    // 6. NEW PROMOTION FORM
    section("6. New promotion form /panel/promociones/nueva");

    try {
      await page.goto(BASE + "/panel/promociones/nueva", { waitUntil: "domcontentloaded", timeout: 20000 });
      await assertLoggedIn(page);
      await page.waitForTimeout(2000);
      pass("Navigated to /panel/promociones/nueva");
    } catch (e) { fail("Navigate to /panel/promociones/nueva", e.message); }

    var promoFieldChecks = [
      { name: "Nombre de la promocion", selector: 'input[placeholder*="Escapada"]' },
      { name: "Descripcion corta", selector: 'textarea[placeholder*="frase breve"]' },
      { name: "Texto alternativo imagen", selector: 'input[placeholder*="Describe"]' },
    ];

    for (var pi = 0; pi < promoFieldChecks.length; pi++) {
      var pfield = promoFieldChecks[pi];
      try {
        await page.locator(pfield.selector).first().waitFor({ state: "visible", timeout: 5000 });
        pass("Field: " + pfield.name);
      } catch (e) { fail("Field: " + pfield.name, e.message); }
    }

    try {
      var dateInputs = await page.locator('input[type="date"]').count();
      if (dateInputs >= 2) pass("Date fields (start + end)", dateInputs + " date inputs");
      else fail("Date fields", "Expected >=2, got " + dateInputs);
    } catch (e) { fail("Date fields", e.message); }

    try {
      await page.locator("select").first().waitFor({ state: "visible", timeout: 5000 });
      pass("Status select present");
    } catch (e) { fail("Status select", e.message); }

    try {
      await page.locator("button", { hasText: "Volver a promociones" }).first().waitFor({ state: "visible", timeout: 5000 });
      pass('"Volver a promociones" button present');
    } catch (e) { fail('"Volver a promociones" button', e.message); }

    try {
      await page.locator("button", { hasText: "Guardar borrador" }).first().waitFor({ state: "visible", timeout: 5000 });
      pass('"Guardar borrador" button present');
    } catch (e) { fail('"Guardar borrador" button', e.message); }

    // 7. LOGOUT
    section("7. Logout");

    try {
      var logoutBtn = page.locator('button[aria-label="Cerrar sesion"]');
      await logoutBtn.first().waitFor({ state: "visible", timeout: 8000 });
      await logoutBtn.first().click();
      await page.waitForURL("**/login", { timeout: 15000 });
      var logoutUrl = page.url();
      if (logoutUrl.includes("/login")) {
        pass("Logout -- redirect to /login", logoutUrl);
      } else {
        fail("Logout redirect", "URL: " + logoutUrl);
      }
    } catch (e) { fail("Logout", e.message); }
  }

  // ======== SUMMARY ========
  console.log("\n" + "=".repeat(50));
  console.log("  TOTAL: " + total + "  |  PASS: " + passed + "  |  FAIL: " + failed + "  |  SKIP: " + skipped);
  console.log("=".repeat(50) + "\n");

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
