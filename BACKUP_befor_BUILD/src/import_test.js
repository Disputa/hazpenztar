(function () {
  function findTargetPanel() {
    const all = Array.from(document.querySelectorAll("div"));

    const infoLine = all.find(el =>
      (el.textContent || "").includes("Utoljára generált hónap:")
    );
    if (!infoLine) return null;

    let node = infoLine;
    while (node && node.parentElement) {
      const rect = node.getBoundingClientRect();
      const text = node.textContent || "";

      if (
        rect.width > 500 &&
        rect.height > 120 &&
        text.includes("Havi PDF reportok") &&
        text.includes("Utoljára generált hónap:")
      ) {
        return node;
      }

      node = node.parentElement;
    }

    return null;
  }

  function renderImportButton() {
    const panel = findTargetPanel();
    if (!panel) return;

    panel.style.paddingBottom = "56px";

    const oldWrap = document.getElementById("importTestWrap");
    if (oldWrap) oldWrap.remove();

    const wrap = document.createElement("div");
    wrap.id = "importTestWrap";
    wrap.style.position = "absolute";
    wrap.style.right = "16px";
    wrap.style.bottom = "16px";
    wrap.style.zIndex = "1000";

    const panelStyle = getComputedStyle(panel);
    if (panelStyle.position === "static") {
      panel.style.position = "relative";
    }

    const button = document.createElement("button");
    button.id = "importTestButton";
    button.textContent = "Import teszt";
    button.style.padding = "8px 14px";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.background = "#1f2937";
    button.style.color = "#ffffff";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";

    wrap.appendChild(button);
    panel.appendChild(wrap);
  }

  function start() {
    renderImportButton();

    const observer = new MutationObserver(() => {
      renderImportButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setInterval(renderImportButton, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();