/* Moteur de quiz : charge un JSON de questions, une question à la fois,
 * correction immédiate avec explication, score sauvegardé dans localStorage. */
(function () {
  "use strict";

  var PREFIX = "soc-quiz:";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Mini-markdown : `code` et **gras**
  function fmt(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function baseUrl() {
    try {
      if (typeof __md_scope !== "undefined") return __md_scope;
    } catch (e) { /* ignore */ }
    return new URL(".", location.href);
  }
  function load(id) {
    try { return JSON.parse(localStorage.getItem(PREFIX + id)); } catch (e) { return null; }
  }
  function save(id, value) {
    try { localStorage.setItem(PREFIX + id, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
  }
  function fetchJson(src) {
    return fetch(new URL(src, baseUrl())).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  /* ---------- Quiz ---------- */

  function initQuiz(root) {
    if (root.getAttribute("data-ready")) return;
    root.setAttribute("data-ready", "1");
    fetchJson(root.getAttribute("data-quiz"))
      .then(function (data) { start(root, data, null); })
      .catch(function (err) {
        root.textContent = "Impossible de charger le quiz (" + err.message + "). " +
          "Le quiz nécessite un serveur (mkdocs serve) ou le site publié.";
      });
  }

  function start(root, data, onlyIds) {
    var pool = data.questions.filter(function (q) {
      return !onlyIds || onlyIds.indexOf(q.id) >= 0;
    });
    var qs = shuffle(pool).map(function (q) {
      return {
        q: q,
        choices: shuffle(q.choices.map(function (t, i) {
          return { text: t, ok: q.answer.indexOf(i) >= 0 };
        }))
      };
    });
    var index = 0;
    var results = [];

    function render() {
      root.innerHTML = "";
      if (index >= qs.length) { summary(); return; }
      var item = qs[index];
      var q = item.q;
      var multi = q.answer.length > 1;

      var head = el("div", "quiz-head");
      head.appendChild(el("span", "quiz-count", "Question " + (index + 1) + " / " + qs.length));
      var bar = el("div", "quiz-bar");
      var fill = el("div", "quiz-bar-fill");
      fill.style.width = Math.round((index / qs.length) * 100) + "%";
      bar.appendChild(fill);
      head.appendChild(bar);
      root.appendChild(head);

      root.appendChild(el("p", "quiz-question", fmt(q.q)));
      if (multi) root.appendChild(el("p", "quiz-hint", "Plusieurs réponses possibles."));

      var list = el("div", "quiz-choices");
      var inputs = [];
      item.choices.forEach(function (c, i) {
        var label = el("label", "quiz-choice");
        var input = document.createElement("input");
        input.type = multi ? "checkbox" : "radio";
        input.name = "q" + index;
        input.addEventListener("change", function () {
          button.disabled = !inputs.some(function (x) { return x.checked; });
        });
        inputs.push(input);
        label.appendChild(input);
        label.appendChild(el("span", "", fmt(c.text)));
        list.appendChild(label);
      });
      root.appendChild(list);

      var feedback = el("div", "quiz-feedback");
      feedback.hidden = true;
      var button = el("button", "md-button md-button--primary quiz-btn", "Valider");
      button.type = "button";
      button.disabled = true;
      root.appendChild(button);
      root.appendChild(feedback);

      var validated = false;
      button.addEventListener("click", function () {
        if (!validated) {
          validated = true;
          var good = true;
          inputs.forEach(function (input, i) {
            var c = item.choices[i];
            var label = list.children[i];
            input.disabled = true;
            if (c.ok && input.checked) label.classList.add("is-correct");
            else if (c.ok && !input.checked) { label.classList.add("is-missed"); good = false; }
            else if (!c.ok && input.checked) { label.classList.add("is-wrong"); good = false; }
          });
          results.push({ id: q.id, ok: good, tags: q.tags || [] });
          feedback.className = "quiz-feedback " + (good ? "is-good" : "is-bad");
          feedback.innerHTML = "<strong>" + (good ? "Correct." : "Incorrect.") + "</strong> " + fmt(q.explain || "");
          feedback.hidden = false;
          button.textContent = index + 1 >= qs.length ? "Voir le résultat" : "Question suivante";
        } else {
          index++;
          render();
        }
      });
    }

    function summary() {
      var total = results.length;
      var okCount = results.filter(function (r) { return r.ok; }).length;
      var pct = total ? Math.round((okCount / total) * 100) : 0;

      var tags = {};
      results.forEach(function (r) {
        r.tags.forEach(function (t) {
          tags[t] = tags[t] || { ok: 0, total: 0 };
          tags[t].total++;
          if (r.ok) tags[t].ok++;
        });
      });

      if (!onlyIds) {
        var prev = load(data.id) || { attempts: 0, best: 0 };
        save(data.id, {
          attempts: prev.attempts + 1,
          best: Math.max(prev.best || 0, pct),
          last: pct,
          date: new Date().toISOString(),
          tags: tags
        });
      }

      var verdict = pct >= 80 ? "Maîtrisé" : pct >= 60 ? "Presque : relis les points manqués" : "À retravailler";
      root.appendChild(el("h3", "quiz-score", okCount + " / " + total + " (" + pct + " %)"));
      root.appendChild(el("p", "quiz-verdict", verdict));

      var names = Object.keys(tags).sort();
      if (names.length) {
        var table = el("table", "quiz-tags");
        table.appendChild(el("thead", "", "<tr><th>Thème</th><th>Score</th></tr>"));
        var body = el("tbody");
        names.forEach(function (t) {
          var v = tags[t];
          body.appendChild(el("tr", "", "<td>" + esc(t) + "</td><td>" + v.ok + " / " + v.total + "</td>"));
        });
        table.appendChild(body);
        root.appendChild(table);
      }

      var missed = results.filter(function (r) { return !r.ok; }).map(function (r) { return r.id; });
      var actions = el("div", "quiz-actions");
      if (missed.length) {
        var retry = el("button", "md-button md-button--primary", "Refaire les " + missed.length + " erreur(s)");
        retry.type = "button";
        retry.addEventListener("click", function () { root.innerHTML = ""; start(root, data, missed); });
        actions.appendChild(retry);
      }
      var again = el("button", "md-button", "Tout recommencer");
      again.type = "button";
      again.addEventListener("click", function () { root.innerHTML = ""; start(root, data, null); });
      actions.appendChild(again);
      root.appendChild(actions);
    }

    render();
  }

  /* ---------- Tableau de bord ---------- */

  function initDashboard(root) {
    if (root.getAttribute("data-ready")) return;
    root.setAttribute("data-ready", "1");
    fetchJson(root.getAttribute("data-dashboard"))
      .then(function (index) { renderDashboard(root, index.quizzes || []); })
      .catch(function (err) { root.textContent = "Impossible de charger l'index des quiz (" + err.message + ")."; });
  }

  function renderDashboard(root, quizzes) {
    root.innerHTML = "";
    var table = el("table", "quiz-dashboard-table");
    table.appendChild(el("thead", "", "<tr><th>Quiz</th><th>Essais</th><th>Dernier</th><th>Meilleur</th></tr>"));
    var body = el("tbody");
    var weak = {};
    var done = 0;
    quizzes.forEach(function (q) {
      var s = load(q.id);
      if (s) {
        done++;
        Object.keys(s.tags || {}).forEach(function (t) {
          weak[t] = weak[t] || { ok: 0, total: 0 };
          weak[t].ok += s.tags[t].ok;
          weak[t].total += s.tags[t].total;
        });
      }
      var link = '<a href="' + esc(new URL(q.page, baseUrl()).href) + '">' + esc(q.title) + "</a>";
      body.appendChild(el("tr", "",
        "<td>" + link + "</td><td>" + (s ? s.attempts : "–") + "</td><td>" +
        (s ? s.last + " %" : "–") + "</td><td>" + (s ? s.best + " %" : "–") + "</td>"));
    });
    table.appendChild(body);
    root.appendChild(el("p", "", "<strong>" + done + " / " + quizzes.length + "</strong> quiz tentés."));
    root.appendChild(table);

    var weakList = Object.keys(weak)
      .map(function (t) { return { t: t, pct: Math.round((weak[t].ok / weak[t].total) * 100), n: weak[t].total }; })
      .filter(function (x) { return x.pct < 70; })
      .sort(function (a, b) { return a.pct - b.pct; });
    if (weakList.length) {
      root.appendChild(el("h3", "", "Thèmes à retravailler"));
      var ul = el("ul");
      weakList.forEach(function (x) {
        ul.appendChild(el("li", "", "<code>" + esc(x.t) + "</code> : " + x.pct + " % (" + x.n + " questions)"));
      });
      root.appendChild(ul);
    }

    var reset = el("button", "md-button", "Réinitialiser ma progression");
    reset.type = "button";
    reset.addEventListener("click", function () {
      if (!confirm("Effacer tous les scores de quiz de ce navigateur ?")) return;
      quizzes.forEach(function (q) {
        try { localStorage.removeItem(PREFIX + q.id); } catch (e) { /* ignore */ }
      });
      renderDashboard(root, quizzes);
    });
    root.appendChild(reset);
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-quiz]"), initQuiz);
    Array.prototype.forEach.call(document.querySelectorAll("[data-dashboard]"), initDashboard);
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(boot); // navigation instantanée Material
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
