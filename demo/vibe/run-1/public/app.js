const rows = document.getElementById("rows");
const empty = document.getElementById("empty");
const err = document.getElementById("error");

async function load() {
  const links = await (await fetch("/api/links")).json();
  empty.hidden = links.length > 0;
  rows.replaceChildren(
    ...links.map((l) => {
      const tr = document.createElement("tr");
      const a = (href, text) => {
        const el = document.createElement("a");
        el.href = href;
        el.textContent = text;
        el.target = "_blank";
        el.rel = "noopener";
        return el;
      };
      const cells = [document.createElement("td"), document.createElement("td"), document.createElement("td")];
      cells[0].append(a(l.short, l.short));
      cells[1].className = "dest";
      cells[1].append(a(l.url, l.url));
      cells[2].className = "n";
      cells[2].textContent = l.clicks;
      tr.append(...cells);
      return tr;
    }),
  );
}

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  err.textContent = "";
  const input = document.getElementById("url");
  const res = await fetch("/api/links", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: input.value }),
  });
  if (!res.ok) {
    err.textContent = (await res.json()).error;
    return;
  }
  input.value = "";
  load();
});

load();
setInterval(load, 5000);
