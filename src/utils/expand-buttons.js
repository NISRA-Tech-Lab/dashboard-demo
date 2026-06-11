export function insertExpandButtons () {

    const elements = [
        ...document.getElementsByClassName("chart-canvas"),
        ...document.getElementsByClassName("table")
    ];

    for (let i = 0; i < elements.length; i ++) {

        const element = elements[i];
        const is_canvas = element.classList.contains("chart-canvas");
        const type = is_canvas ? "chart" : "table";

        const card_footer = element.parentElement.parentElement.parentElement.parentElement?.querySelector(".card-footer")
            || element.parentElement.parentElement.parentElement?.querySelector(".card-footer");

        if (card_footer) {

            const button = document.createElement("button");
            button.className = "btn btn-sm btn-outline-secondary rounded-circle d-none d-xl-flex ms-auto justify-content-between align-items-center";
            button.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
            button.setAttribute("data-bs-toggle", "modal");
            button.setAttribute("data-bs-target", `#${element.id}-modal`);
            button.setAttribute("title", `Expand ${type}`);
            button.setAttribute("data-bs-placement", "left");
            button.style.marginTop = "-50px";
            button.style.marginBottom = "20px";
            button.style.marginLeft = "80px";
            new bootstrap.Tooltip(button);
            card_footer.appendChild(button);

            const title = is_canvas
                ? element.parentElement.parentElement.parentElement.querySelector(".card-header").innerHTML
                : element.parentElement.parentElement.querySelector(".card-header").innerHTML;

            const modal_body = is_canvas
                ? `<canvas id="${element.id}-expanded"></canvas>`
                : `
                    <table id="${element.id}-expanded" class="${element.className}">
                        ${element.innerHTML}
                    </table>
                `;

            const modal = document.createElement("div");
            modal.classList.add("modal", "fade");
            modal.id = `${element.id}-modal`;
            modal.tabIndex = -1;
            modal.setAttribute("aria-hidden", "true");
            modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <p class="h5 modal-title">${title}</p>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${modal_body}
                    </div>
                </div>
            </div>
            `;
            element.parentNode.appendChild(modal);

        }

    }

}