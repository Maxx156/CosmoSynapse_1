// Minimal client-side auth for prototype/demo (no backend).
// Stores a single user and a session in localStorage.
(() => {
  const KEYS = {
    user: "cs_user",
    session: "cs_session",
  };

  const syncHeaderHeightVar = () => {
    const header = document.querySelector(".cs-header");
    if (!header) return;
    const update = () => {
      const h = header.getBoundingClientRect().height;
      if (!Number.isFinite(h) || h <= 0) return;
      document.documentElement.style.setProperty("--header-height", `${Math.ceil(h)}px`);
    };
    update();
    window.addEventListener("resize", update);
  };

  const safeJsonParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const getUser = () => safeJsonParse(localStorage.getItem(KEYS.user));
  const setUser = (user) => localStorage.setItem(KEYS.user, JSON.stringify(user));
  const clearUser = () => localStorage.removeItem(KEYS.user);

  const getSession = () => safeJsonParse(localStorage.getItem(KEYS.session));
  const setSession = (session) =>
    localStorage.setItem(KEYS.session, JSON.stringify(session));
  const clearSession = () => localStorage.removeItem(KEYS.session);

  const isLoggedIn = () => {
    const user = getUser();
    const session = getSession();
    return Boolean(user?.email && session?.email && session.email === user.email);
  };

  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

  const setFormError = (rootEl, message) => {
    const el = rootEl?.querySelector?.(".cs-form-error");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  };

  const setFormSuccess = (rootEl, message) => {
    const el = rootEl?.querySelector?.(".cs-form-success");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  };

  const go = (path) => window.location.assign(path);
  const replace = (path) => window.location.replace(path);

  const requireRegistration = () => {
    const user = getUser();
    if (!user) replace("register.html");
  };

  const requireLogin = () => {
    if (!isLoggedIn()) replace("login.html");
  };

  const bindLogout = () => {
    const btn = document.getElementById("cs-logout-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      clearSession();
      go("login.html");
    });
  };

  const bindRegister = () => {
    const form = document.getElementById("cs-register-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setFormError(form, "");
      setFormSuccess(form, "");

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = normalizeEmail(fd.get("email"));
      const password = String(fd.get("password") || "");
      const password2 = String(fd.get("password2") || "");

      if (!name || name.length < 2) {
        setFormError(form, "Укажите имя (минимум 2 символа).");
        return;
      }
      if (!email || !email.includes("@") || email.length < 5) {
        setFormError(form, "Укажите корректный email.");
        return;
      }
      if (!password || password.length < 6) {
        setFormError(form, "Пароль должен быть не короче 6 символов.");
        return;
      }
      if (password !== password2) {
        setFormError(form, "Пароли не совпадают.");
        return;
      }

      const existing = getUser();
      if (existing?.email) {
        // Prototype: one user. If already registered, go to login.
        replace("login.html");
        return;
      }

      setUser({
        name,
        email,
        password, // NOTE: plaintext only for prototype; do not do this in production.
        createdAt: new Date().toISOString(),
      });

      setFormSuccess(form, "Регистрация выполнена. Перенаправляем на вход…");
      setTimeout(() => go("login.html"), 600);
    });
  };

  const bindLogin = () => {
    const form = document.getElementById("cs-login-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setFormError(form, "");
      setFormSuccess(form, "");

      const user = getUser();
      if (!user) {
        replace("register.html");
        return;
      }

      const fd = new FormData(form);
      const email = normalizeEmail(fd.get("email"));
      const password = String(fd.get("password") || "");

      if (email !== normalizeEmail(user.email) || password !== String(user.password)) {
        setFormError(form, "Неверный email или пароль.");
        return;
      }

      setSession({
        email: normalizeEmail(user.email),
        createdAt: new Date().toISOString(),
      });

      setFormSuccess(form, "Успешный вход. Перенаправляем на главную…");
      setTimeout(() => go("home.html"), 450);
    });
  };

  const bindContact = () => {
    const form = document.getElementById("cs-contact-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setFormError(form, "");
      setFormSuccess(form, "");

      const fd = new FormData(form);
      const emailRaw = String(fd.get("email") || "").trim();
      const email = normalizeEmail(emailRaw);
      const topic = String(fd.get("topic") || "").trim();
      const message = String(fd.get("message") || "").trim();

      if (!email || !email.includes("@") || email.length < 5) {
        setFormError(form, "Укажите корректный email для обратной связи.");
        return;
      }
      if (!topic || topic.length < 3) {
        setFormError(form, "Укажите тему (минимум 3 символа).");
        return;
      }
      if (!message || message.length < 10) {
        setFormError(form, "Сообщение должно быть не короче 10 символов.");
        return;
      }

      const user = getUser();
      const payload = {
        from: user?.email || email,
        name: user?.name || null,
        contactEmail: email,
        topic,
        message,
        createdAt: new Date().toISOString(),
      };

      // Prototype: save feedback locally.
      const boxKey = "cs_feedback";
      const prev = safeJsonParse(localStorage.getItem(boxKey)) || [];
      prev.unshift(payload);
      localStorage.setItem(boxKey, JSON.stringify(prev.slice(0, 50)));

      form.reset();
      setFormSuccess(form, "Спасибо! Сообщение отправлено (сохранено локально).");
    });
  };

  const decorateUser = () => {
    const user = getUser();
    const el = document.getElementById("cs-user-name");
    if (el && user?.name) el.textContent = user.name;
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncHeaderHeightVar();

    const page = document.body?.dataset?.csPage || "";

    // Common
    bindLogout();

    if (page === "register") {
      // Разрешаем заходить на регистрацию всегда:
      // пользователь может захотеть изменить данные или просто посмотреть форму.
      bindRegister();
      return;
    }

    if (page === "login") {
      // Если уже вошли — сразу на главную.
      if (isLoggedIn()) {
        replace("home.html");
        return;
      }
      // Если ещё нет зарегистрированного пользователя — всё равно показываем форму,
      // а при попытке входа аккуратно перенаправим на регистрацию.
      bindLogin();
      return;
    }

    if (page === "home") {
      requireRegistration();
      requireLogin();
      decorateUser();
      return;
    }

    if (page === "contact") {
      requireRegistration();
      requireLogin();
      decorateUser();
      bindContact();
      return;
    }
  });

  // Expose a tiny API for debugging if needed.
  window.CosmoSynapseAuth = {
    getUser,
    getSession,
    isLoggedIn,
    logout: () => {
      clearSession();
      return true;
    },
    resetAll: () => {
      clearSession();
      clearUser();
      return true;
    },
  };
})();

