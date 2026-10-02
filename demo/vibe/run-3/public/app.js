const form = document.getElementById("shorten");
const input = document.getElementById("url");
const submit = form.querySelector("button[type=submit]");
const message = document.getElementById("message");
const result = document.getElementById("result");
const resultLink = document.getElementById("result-link");
const copyButton = document.getElementById("copy");
const rows = document.getElementById("rows");
const count = document.getElementById("count");

function setMessage(text, ok = false) {
  message.textContent = text;
  message.classList.toggle("ok", ok);
}

function cell(className, child) {
  const td = document.createElement("td");
  if (className) td.className = className;
  if (typeof child === "string") td.textContent = child;
  else td.appendChild(child);
  return td;
}

function render(links) {
  rows.replaceChildren();
  count.textContent = links.length === 1 ? "1 link" : `${links.length} links`;
  if (links.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty";
    tr.appendChild(cell("", "No links yet. Shorten one above."));
    tr.firstChild.colSpan = 3;
    rows.appendChild(tr);
    return;
  }
  for (const link of links) {
    const tr = document.createElement("tr");
    const a = document.createElement("a");
    a.href = link.shortUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = link.shortUrl.replace(/^https?:\/\//, "");
    tr.appendChild(cell("", a));
    const dest = cell("dest", link.url);
    dest.title = link.url;
    tr.appendChild(dest);
    tr.appendChild(cell("num", String(link.clicks)));
    rows.appendChild(tr);
  }
}

async function load() {
  const res = await fetch("/api/links");
  if (!res.ok) throw new Error("Failed to load links");
  render(await res.json());
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");
  submit.disabled = true;
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.value }),
    });
    const body = await res.json();
    if (!res.ok) {
      setMessage(body.error ?? "Something went wrong.");
      return;
    }
    resultLink.href = body.shortUrl;
    resultLink.textContent = body.shortUrl;
    result.hidden = false;
    input.value = "";
    setMessage("Short link created.", true);
    await load();
  } catch (err) {
    setMessage(err.message);
  } finally {
    submit.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultLink.href);
    copyButton.textContent = "Copied";
    setTimeout(() => { copyButton.textContent = "Copy"; }, 1500);
  } catch {
    setMessage("Could not copy to clipboard.");
  }
});

load().catch((err) => setMessage(err.message));
setInterval(() => load().catch(() => {}), 5000);
