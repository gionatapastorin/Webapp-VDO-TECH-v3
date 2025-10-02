// ============================================================================
// SCRIPT GLOBALE (Precedentemente in app.html)
// ============================================================================
(function () {
    // URL della Web App pubblicata su Google Apps Script
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzdMikZRPiZwQqNVvyx3ggP-D4Z0_iqCtnN3c97WoyEh6_W-UbgOWRtDsBO0XSf9jWB8A/exec';

    // Funzione helper per chiamare il backend in modo asincrono
    async function callBackend(functionName, payload) {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                functionName,
                payload
            })
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
    }

    // Rendi la funzione helper globale per essere usata dagli script delle view
    window.callBackend = callBackend;

    const byId = id => document.getElementById(id);
    const switcher = byId('switcher');
    const btnClim = byId('btn-clim');
    const btnHiv = byId('btn-hiv');
    const viewClim = byId('view-clim');
    const viewHiv = byId('view-hiv');
    const btnInterv = byId('btn-interv');
    const viewInterv = byId('view-interv');

    window.APP = window.APP || {};
    const $ = (sel, root = document) => root.querySelector(sel);
    const views = document.getElementById('views');

    const loginBox = $('#loginBox');
    const userBox = $('#userBox');
    const accessCode = $('#accessCode');
    const btnLogin = $('#btnLogin');
    const loginStatus = $('#loginStatus');
    const userNameEl = $('#userName');
    const userRoleEl = $('#userRole');
    const btnLogout = $('#btnLogout');

    (function preloadIcons() {
        const srcs = [
            'https://www.noticons.com/icon/DpLb/11735D/FFFEFE00.svg',
            'https://www.noticons.com/icon/DpLb/D4EDBC/FFFEFE00.svg',
            'https://www.noticons.com/icon/xJqj/11735D/FFFEFE00.svg',
            'https://www.noticons.com/icon/xJqj/D4EDBC/FFFEFE00.svg',
            'https://www.noticons.com/icon/nwa9/11735D/FFFEFE00.svg',
            'https://www.noticons.com/icon/nwa9/D4EDBC/FFFEFE00.svg'
        ];
        srcs.forEach(s => {
            const im = new Image();
            im.decoding = 'async';
            im.src = s;
        });
    })();

    function setLoginStatus(msg, ok) {
        if (!loginStatus) return;
        loginStatus.textContent = msg || '';
        loginStatus.classList.toggle('is-error', ok === false);
    }

    function saveUser(u) {
        try {
            localStorage.setItem('vdo_user', JSON.stringify(u));
        } catch (e) {}
    }

    function loadUser() {
        try {
            return JSON.parse(localStorage.getItem('vdo_user') || 'null');
        } catch (e) {
            return null;
        }
    }

    function clearUser() {
        try {
            localStorage.removeItem('vdo_user');
        } catch (e) {}
    }

    function renderUser() {
        const u = APP.user || null;
        if (u && u.name) {
            if (userNameEl) userNameEl.textContent = u.name;
            if (userRoleEl) userRoleEl.textContent = u.role ? `(${u.role})` : '';
            if (loginBox) loginBox.style.display = 'none';
            if (userBox) userBox.style.display = '';
            document.querySelectorAll('#clim-root #quiRadios, #hiv-root #quiRadios').forEach(el => el && (el.style.display = 'none'));
            if (views) views.setAttribute('aria-hidden', 'false');
            document.dispatchEvent(new CustomEvent('userchange', {
                detail: {
                    user: u
                }
            }));
            if (btnClim) btnClim.style.display = '';
            if (btnHiv) btnHiv.style.display = '';
            if (btnInterv) btnInterv.style.display = '';
        } else {
            if (loginBox) loginBox.style.display = '';
            if (userBox) userBox.style.display = 'none';
            document.querySelectorAll('#clim-root #quiRadios, #hiv-root #quiRadios').forEach(el => el && (el.style.display = ''));
            if (views) views.setAttribute('aria-hidden', 'true');
            document.dispatchEvent(new CustomEvent('userchange', {
                detail: {
                    user: null
                }
            }));
            if (btnClim) btnClim.style.display = 'none';
            if (btnHiv) btnHiv.style.display = 'none';
            if (btnInterv) btnInterv.style.display = 'none';
        }
    }

    async function doLogin() {
        const code = (accessCode && accessCode.value || '').trim();
        if (!code) {
            setLoginStatus('Entrez un code', false);
            return;
        }
        setLoginStatus('Vérification en cours…');

        try {
            const res = await callBackend('validateAccessCode', code);
            if (res && res.ok && res.user && res.user.name) {
                APP.user = {
                    name: res.user.name,
                    role: res.user.role || '',
                    code
                };
                saveUser(APP.user);
                setLoginStatus('Accès réussi', true);
                renderUser();
            } else {
                setLoginStatus(res && res.reason ? res.reason : 'Code non valide.', false);
            }
        } catch (err) {
            console.error(err);
            setLoginStatus('Erreur réseau ou serveur.', false);
        }
    }

    function doLogout() {
        APP.user = null;
        clearUser();
        renderUser();
    }

    if (btnLogin) btnLogin.addEventListener('click', doLogin);
    if (accessCode) accessCode.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') doLogin();
    });
    if (btnLogout) btnLogout.addEventListener('click', doLogout);

    const stored = loadUser();
    if (stored && stored.code) {
        setLoginStatus('Vérification en cours…');
        callBackend('validateAccessCode', stored.code)
            .then(res => {
                if (res && res.ok && res.user) {
                    APP.user = {
                        name: res.user.name,
                        role: res.user.role || '',
                        code: stored.code
                    };
                    saveUser(APP.user);
                } else {
                    clearUser();
                    APP.user = null;
                    setLoginStatus(res && res.reason ? res.reason : "Accès réservé à l'équipe Technique", false);
                }
                renderUser();
            })
            .catch(() => {
                clearUser();
                APP.user = null;
                renderUser();
            });
    } else {
        APP.user = (stored && stored.name) ? stored : null;
        renderUser();
    }

    window.APP = APP;
    document.addEventListener('viewchange', renderUser);

    function setActive(mode) {
        switcher.classList.add('compact');
        const isClim = mode === 'clim';
        const isHiv = mode === 'hiv';
        const isInterv = mode === 'interv';
        btnClim && btnClim.classList.toggle('is-selected', isClim);
        btnHiv && btnHiv.classList.toggle('is-selected', isHiv);
        btnInterv && btnInterv.classList.toggle('is-selected', isInterv);
        btnClim && btnClim.classList.toggle('is-collapsed', !isClim);
        btnHiv && btnHiv.classList.toggle('is-collapsed', !isHiv);
        btnInterv && btnInterv.classList.toggle('is-collapsed', !isInterv);
        viewClim && viewClim.classList.toggle('is-active', isClim);
        viewHiv && viewHiv.classList.toggle('is-active', isHiv);
        viewInterv && viewInterv.classList.toggle('is-active', isInterv);
        document.dispatchEvent(new CustomEvent('viewchange', {
            detail: {
                view: mode
            }
        }));
    }

    btnClim && btnClim.addEventListener('click', () => setActive('clim'));
    btnHiv && btnHiv.addEventListener('click', () => setActive('hiv'));
    btnInterv && btnInterv.addEventListener('click', () => setActive('interv'));
    setActive('hiv'); // Imposta una vista predefinita
})();

// ============================================================================
// SCRIPT PER LA VISTA CLIM (Precedentemente in view-clim.html)
// ============================================================================
(function () {
    const root = document.getElementById('clim-root');
    if (!root) return;

    const statusEl = root.querySelector('#status');
    const submitEl = root.querySelector('#submitBtn');
    const mhSelect = root.querySelector('#mhSelect');
    const radiosBox = root.querySelector('#quiRadios');
    const gsWarn = document.getElementById('gsWarn'); // Cerca globalmente

    const state = {
        who: '',
        mh: ''
    };

    if (window.APP && APP.user && APP.user.name) {
        state.who = APP.user.name;
        if (radiosBox) radiosBox.style.display = 'none';
    }

    document.addEventListener('userchange', (ev) => {
        const u = ev.detail && ev.detail.user;
        state.who = (u && u.name) ? u.name : '';
        if (radiosBox) radiosBox.style.display = (u && u.name) ? 'none' : '';
        validate();
    });

    function setStatus(msg, ok) {
        statusEl.textContent = msg || '';
        statusEl.style.color = ok ? '#0b6e4f' : '#9b2226';
    }

    function validate() {
        submitEl.disabled = !state.mh;
    }

    function populateMH(list) {
        mhSelect.innerHTML = '<option value="">Sélectionnez n° MH…</option>';
        (list || []).forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            mhSelect.appendChild(o);
        });
        mhSelect.disabled = false;
        if (state.mh) {
            mhSelect.value = state.mh;
            if (mhSelect.value !== state.mh) state.mh = '';
        }
        validate();
    }

    async function loadMH() {
        mhSelect.disabled = true;
        mhSelect.innerHTML = '<option value="">Chargement…</option>';
        try {
            const list = await window.callBackend('getMhOptions');
            populateMH(list);
            setStatus('Prêt.', true);
        } catch (err) {
            console.error(err);
            setStatus('Erreur chargement MH.', false);
            if (gsWarn) gsWarn.style.display = 'block';
            mhSelect.disabled = false;
            validate();
        }
    }

    radiosBox.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'person') {
            state.who = e.target.value;
            validate();
        }
    });

    mhSelect.addEventListener('change', () => {
        state.mh = mhSelect.value.trim();
        validate();
    });

    submitEl.addEventListener('click', async () => {
        if (submitEl.disabled) return;
        submitEl.disabled = true;
        setStatus('Enregistrement…', true);
        const who = state.who || (window.APP && APP.user && APP.user.name) || '';
        const payload = {
            person: who,
            mh: state.mh
        };
        try {
            await window.callBackend('submitForm', payload);
            setStatus('✅ Enregistré', true);
            state.mh = '';
            mhSelect.value = '';
            await loadMH();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } catch (err) {
            console.error(err);
            setStatus('Erreur: ' + (err && err.message ? err.message : err), false);
        } finally {
            validate();
        }
    });

    setStatus('Prêt.', true);
    loadMH();
    validate();
})();

// ============================================================================
// SCRIPT PER LA VISTA HIVERNAGE (Precedentemente in view-hivernage.html)
// ============================================================================
(function () {
    const root = document.getElementById('hiv-root');
    if (!root) return;

    const state = {
        who: '',
        mh: '',
        checks: []
    };

    if (window.APP && APP.user && APP.user.name) {
        state.who = APP.user.name;
        const radios = root.querySelector('#quiRadios');
        if (radios) radios.style.display = 'none';
    }

    const statusEl = root.querySelector('#status');
    const submitEl = root.querySelector('#submitBtn');
    const resetEl = root.querySelector('#resetBtn');
    const mhSelect = root.querySelector('#mhSelect');

    document.addEventListener('userchange', (ev) => {
        const u = ev.detail && ev.detail.user;
        state.who = (u && u.name) ? u.name : '';
        const radios = root.querySelector('#quiRadios');
        if (radios) radios.style.display = (u && u.name) ? 'none' : '';
        validate();
    });

    root.querySelectorAll('.card-header[role="button"]').forEach(h => {
        h.addEventListener('click', () => {
            const target = root.querySelector('#' + h.dataset.target);
            const wasOpen = target.classList.contains('open');
            root.querySelectorAll('.card-content').forEach(c => {
                c.classList.remove('open');
                c.setAttribute('aria-hidden', 'true');
            });
            root.querySelectorAll('.card-header[role="button"]').forEach(x => {
                x.setAttribute('aria-expanded', 'false');
                const ch = x.querySelector('.chev');
                if (ch) ch.style.transform = 'rotate(0deg)';
            });
            if (!wasOpen) {
                target.classList.add('open');
                target.setAttribute('aria-hidden', 'false');
                h.setAttribute('aria-expanded', 'true');
                const ch = h.querySelector('.chev');
                if (ch) ch.style.transform = 'rotate(180deg)';
            }
            requestAnimationFrame(() => {
                h.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
        h.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                h.click();
            }
        });
    });

    root.querySelector('#quiRadios').addEventListener('change', (e) => {
        if (e.target && e.target.name === 'qui') {
            state.who = e.target.value;
            validate();
        }
    });

    mhSelect.addEventListener('change', () => {
        state.mh = mhSelect.value.trim();
        validate();
    });

    function hookCheckboxes() {
        const cbs = root.querySelectorAll('.check-item input[type="checkbox"]');
        state.checks = Array.from(cbs).map(cb => cb.checked);
        cbs.forEach((cb, idx) => {
            cb.addEventListener('change', () => {
                state.checks[idx] = cb.checked;
                validate();
            });
        });
    }

    function validate() {
        const mhOk = !!state.mh;
        const allChecked = state.checks.length > 0 && state.checks.every(v => v === true);
        submitEl.disabled = !(mhOk && allChecked);
    }

    function setStatus(msg, ok) {
        statusEl.textContent = msg || '';
        statusEl.style.color = ok ? '#0b6e4f' : '#9b2226';
    }

    async function loadMH() {
        mhSelect.disabled = true;
        mhSelect.innerHTML = '<option value="">Chargement…</option>';
        try {
            const list = await window.callBackend('getMHOptions'); // Nota la M maiuscola
            mhSelect.innerHTML = '<option value="">Sélectionnez n° MH…</option>';
            (list || []).forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                mhSelect.appendChild(o);
            });
            if (state.mh) {
                mhSelect.value = state.mh;
                if (mhSelect.value !== state.mh) state.mh = '';
            }
        } catch (err) {
            console.error(err);
            setStatus('Erreur chargement MH.', false);
        } finally {
            mhSelect.disabled = false;
            validate();
        }
    }

    async function handleSubmit() {
        if (submitEl.disabled) return;
        submitEl.disabled = true;
        setStatus('Enregistrement…', true);
        const who = state.who || (window.APP && APP.user && APP.user.name) || '';
        const payload = {
            qui: who,
            mh: state.mh,
            checks: state.checks.slice()
        };

        try {
            const res = await window.callBackend('submitHivernage', payload);
            setStatus(`Enregistré (ligne ${res && res.row ? res.row : '?' }).`, true);
            resetAll(false); // Resetta senza scrollare
            await loadMH();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } catch (err) {
            console.error(err);
            setStatus('Erreur: ' + (err && err.message ? err.message : err), false);
        } finally {
            validate();
        }
    }

    function resetAll(doScroll = true) {
        root.querySelectorAll('.check-item input[type="checkbox"]').forEach(cb => cb.checked = false);
        state.checks = state.checks.map(() => false);
        mhSelect.value = '';
        state.mh = '';
        root.querySelectorAll('.card-content.open').forEach(c => {
            c.classList.remove('open');
            c.setAttribute('aria-hidden', 'true');
            const header = document.querySelector(`[data-target="${c.id}"]`);
            if (header) {
                header.setAttribute('aria-expanded', 'false');
                const chev = header.querySelector('.chev');
                if (chev) chev.style.transform = 'rotate(0deg)';
            }
        });
        if (doScroll) window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        validate();
    }

    const checked = root.querySelector('#quiRadios input[type="radio"]:checked');
    state.who = checked ? checked.value : state.who;
    hookCheckboxes();
    validate();
    loadMH();
    resetEl.addEventListener('click', () => resetAll(true));
    submitEl.addEventListener('click', handleSubmit);
})();