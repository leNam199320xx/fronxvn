import { createModal } from '../../panels/ui/modal.js';

export function showPreview(tpl, onNewProject, onInsertPages) {
    const body = document.createElement('div');
    body.className = 'tpl-preview-body';

    const img = document.createElement('div');
    img.className = 'tpl-preview-thumb';
    if (tpl.thumbnail) img.style.backgroundImage = `url("${tpl.thumbnail}")`;
    body.appendChild(img);

    const desc = document.createElement('p');
    desc.className   = 'tpl-preview-desc';
    desc.textContent = tpl.description || '';
    body.appendChild(desc);

    if (tpl.pages_data) {
        const pageList = document.createElement('div');
        pageList.className = 'tpl-preview-pages';
        pageList.innerHTML = `<strong>Pages:</strong> ${tpl.pages_data.map(p => p.name).join(', ')}`;
        body.appendChild(pageList);
    }

    const footer = document.createElement('div');
    footer.className = 'tpl-preview-footer';

    const btnNew = document.createElement('button');
    btnNew.className   = 'tpl-btn tpl-btn-primary';
    btnNew.textContent = 'New Project';
    btnNew.addEventListener('click', () => { modal.remove(); if (onNewProject) onNewProject(tpl); });

    const btnInsert = document.createElement('button');
    btnInsert.className   = 'tpl-btn';
    btnInsert.textContent = 'Insert Pages';
    btnInsert.addEventListener('click', () => { modal.remove(); if (onInsertPages) onInsertPages(tpl); });

    footer.appendChild(btnNew);
    footer.appendChild(btnInsert);

    const { modal, dialog } = createModal({
        title: tpl.name,
        content: body,
        className: 'tpl-preview-modal'
    });

    dialog.appendChild(footer);
}

