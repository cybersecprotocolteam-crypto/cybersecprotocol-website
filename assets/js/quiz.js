/* The free quiz: six questions, answers kept on this page only (no storage, no network). */
(function () {
  var QUESTIONS = [
    {
      q: "You use the same password on many sites. What is the best fix?",
      o: ["A different long password for every account, kept in a password manager", "One very long password used everywhere", "Change the same password every month", "Add a number at the end of the old password"],
      a: 0,
      why: "When one site leaks, attackers try the same email and password everywhere. Unique passwords stop that chain, and a manager remembers them for you."
    },
    {
      q: "What does the padlock in the browser (HTTPS) prove?",
      o: ["The website is honest", "The connection to the site is encrypted", "The site has no viruses", "The site is run by a company"],
      a: 1,
      why: "HTTPS only means the connection is encrypted. Scam sites can have a padlock too, so check the address as well."
    },
    {
      q: "Which is the strongest red flag in a message?",
      o: ["A friendly greeting", "Correct spelling", "Pressure to act within minutes", "A company logo"],
      a: 2,
      why: "Urgency and threats are meant to stop you from thinking. Slow down and check the sender and the link."
    },
    {
      q: "What is the root cause of SQL injection?",
      o: ["An old version of SQL", "User input is pasted into the query, so data can become code", "A database that is too big", "A weak Wi-Fi password"],
      a: 1,
      why: "When input is joined into the query text, the database cannot tell your SQL from the attacker's. Parameterised queries fix it."
    },
    {
      q: "What does two-step verification add?",
      o: ["A longer username", "A second proof besides the password", "More advertising", "A faster login"],
      a: 1,
      why: "Even if a password is stolen, the attacker still needs the second step. A passkey or an authenticator app is stronger than a text message."
    },
    {
      q: "When is it legal to test a website for weaknesses?",
      o: ["When you are curious and mean no harm", "When it belongs to a big company", "When you own it or have written permission from the owner", "When you use a VPN"],
      a: 2,
      why: "Testing without the owner's permission is illegal in most countries, whatever your intentions. Use labs made for learning."
    }
  ];

  var root = document.getElementById("quiz");
  if (!root) return;
  var index = 0;
  var score = 0;

  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }

  function show() {
    root.textContent = "";
    if (index >= QUESTIONS.length) {
      var done = el("div", "", "card");
      done.appendChild(el("h2", "You got " + score + " of " + QUESTIONS.length));
      done.appendChild(el("p", score >= 5 ? "Strong basics. The app takes you much further." : "A good start. Every one of these is a lesson in the app.", "muted"));
      var again = el("button", "Try again", "btn btn-ghost");
      again.type = "button";
      again.addEventListener("click", function () { index = 0; score = 0; show(); });
      done.appendChild(again);
      root.appendChild(done);
      return;
    }
    var item = QUESTIONS[index];
    var card = el("div", "", "card");
    card.appendChild(el("p", "Question " + (index + 1) + " of " + QUESTIONS.length, "muted"));
    card.appendChild(el("h2", item.q));
    var note = el("p", "", "muted");
    var buttons = [];
    item.o.forEach(function (text, i) {
      var b = el("button", text, "btn btn-ghost");
      b.type = "button";
      b.style.display = "block";
      b.style.width = "100%";
      b.style.textAlign = "left";
      b.style.marginTop = "10px";
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.disabled = true; });
        if (i === item.a) {
          score += 1;
          b.style.borderColor = "#3ddc97";
          note.textContent = "Correct. " + item.why;
        } else {
          b.style.borderColor = "#ff6b6b";
          buttons[item.a].style.borderColor = "#3ddc97";
          note.textContent = "Not quite. " + item.why;
        }
        var next = el("button", index === QUESTIONS.length - 1 ? "See my score" : "Next question", "btn btn-primary");
        next.type = "button";
        next.style.marginTop = "14px";
        next.addEventListener("click", function () { index += 1; show(); });
        card.appendChild(next);
        next.focus();
      });
      buttons.push(b);
      card.appendChild(b);
    });
    card.appendChild(note);
    root.appendChild(card);
  }

  show();
})();
