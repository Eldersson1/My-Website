function makeLinksClickable(element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT
    );

    const textNodes = [];

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach(node => {
        // Don't modify text inside links, scripts, styles, etc.
        if (
            node.parentElement.closest(
                'a, script, style, textarea, input'
            )
        ) return;

        const text = node.nodeValue;

        if (!text.includes("https://")) return;

        const fragment = document.createDocumentFragment();
        const parts = text.split(/(https:\/\/[^\s<]+)/g);

        parts.forEach(part => {
            if (part.startsWith("https://")) {
                const link = document.createElement("a");

                link.href = part;
                link.textContent = part;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                fragment.appendChild(link);
            } else {
                fragment.appendChild(
                    document.createTextNode(part)
                );
            }
        });

        node.parentNode.replaceChild(fragment, node);
    });
}

makeLinksClickable(document.body);