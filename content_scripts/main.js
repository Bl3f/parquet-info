(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;


  function createTooltip () {
    let tip = document.getElementById("tooltip")
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'tooltip';
      document.body.append(tip);
    }

    tip.style.display = "none";

    return tip;
  }

  const tip = createTooltip();

  function handler (event, { schema }) {
    const columns = schema.map(column => `<div><span class="name">${column.column_name}</span> <span class="type">(${column.type})</span></div>`)

    const rect = tip.getBoundingClientRect();
    const rectWidth = rect.width + 16;
    const vWidth = window.innerWidth - rectWidth;
    const rectX = event.clientX + rectWidth;
    const minX = rectX;
    const maxX = window.innerWidth;
    const x = rectX < minX ? rectWidth : rectX > maxX ? vWidth : event.clientX;
    tip.style.display = "block";
    tip.style.left = `${x}px`;
    tip.style.top = `${event.clientY}px`;
    tip.innerHTML = columns.join("");
  }

  const links = document.getElementsByClassName('object-link');
  for (let item of links) {
    const filename = item.textContent.trim();
    if (filename.endsWith('.parquet')) {
      item.addEventListener('mouseover', (event) => {
        const sending = browser.runtime.sendMessage({ filename });
        sending.then((d) => handler(event, d));
      });

      item.addEventListener('mouseout', (event) => {
        tip.style.display = "none";
      })
    }
  }
})();
