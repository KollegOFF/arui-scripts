import { urlSegmentWithoutEndSlash } from './normalize-url-segment';

type ScriptsFetcherParams = {
    moduleId: string;
    urls: string[];
    baseUrl: string;
    targetNode: Node;
    attributes?: Record<string, string>;
};

/**
 * Подключает js скрипты на страницу.
 * Просто маунтит их в DOM и резолвит промис когда все скрипты загрузятся.
 * @param moduleId ID модуля, который запросил эти скрипты
 * @param urls адреса подключаемых скриптов
 * @param baseUrl базовый адрес модуля
 * @param targetNode HTML элемент, в который мы добавляем скрипты
 * @param attributes Дополнительные аттрибуты, которые будут добавлены к тегу скрипта
 */
export function scriptsFetcher({
    moduleId,
    urls,
    baseUrl,
    targetNode,
    attributes,
}: ScriptsFetcherParams): Promise<HTMLElement[]> {
    return Promise.all(urls.map((src) => appendScriptTag({ src, baseUrl, moduleId, targetNode, attributes })));
}

type StylesFetcherParams = {
    moduleId: string;
    urls: string[];
    baseUrl: string;
    targetNode: Node;
};

/**
 * Подключает на страницу css приложения. Скачивает их, исправляет ссылки на ассеты так, чтобы они корректно
 * отсчитывались от базового адреса текущей страницы
 * @param moduleId ID модуля, который запросил эти стили
 * @param urls адреса подключаемых стилей
 * @param baseUrl базовый адрес модуля
 * @param targetNode
 */
export async function stylesFetcher({
    moduleId,
    urls,
    baseUrl,
    targetNode,
}: StylesFetcherParams): Promise<HTMLElement[]> {
    const promises = urls.map((url) =>
        appendCssTag({
            href: `${urlSegmentWithoutEndSlash(baseUrl)}/${url}`,
            moduleId,
            targetNode,
        }),
    );

    return Promise.all(promises);
}

/**
 * Название аттрибута, в который будет записываться moduleId при добавлении ресурсов в DOM
 */
const DATA_APP_ID_ATTRIBUTE = 'data-parent-app-id';

type RemoveModuleResourcesParams = {
    moduleId: string;
    targetNodes: ParentNode[];
};

/**
 * Удаляет все ресурсы, которые были добавлены в дом для приложения
 * @param moduleId ID приложения, ресурсы которого мы удаляем
 * @param targetNodes Список HTML элементов, в которых мы ищем ресурсы для удаления
 */
export function removeModuleResources({ moduleId, targetNodes }: RemoveModuleResourcesParams): void {
    targetNodes.forEach((targetNode) => {
        const resources = nodeListToArray(
            targetNode.querySelectorAll(`[${DATA_APP_ID_ATTRIBUTE}="${moduleId}"]`),
        );

        resources.forEach((element) => {
            element.parentNode?.removeChild(element);
        });
    });
}

function nodeListToArray<T extends Node>(nodeList: NodeListOf<T>): T[] {
    return [].slice.call(nodeList);
}

function appendTagAsync(element: HTMLElement, targetNode: Node): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
        element.addEventListener('load', () => {
            resolve(element);
        });
        element.addEventListener('error', (error) => {
            reject(error);
        });
        targetNode.appendChild(element);
    });
}

type AppendScriptTagParams = {
    src: string;
    baseUrl: string;
    moduleId: string;
    targetNode: Node;
    attributes?: Record<string, string>;
};

function appendScriptTag({ src, baseUrl, moduleId, targetNode, attributes }: AppendScriptTagParams) {
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.src = `${urlSegmentWithoutEndSlash(baseUrl)}/${src}`;
    script.defer = true;
    // используем setAttribute, а не dataset потому что так нам не надо конвертировать название аттрибута в js/html вид
    script.setAttribute(DATA_APP_ID_ATTRIBUTE, moduleId);

    if (attributes) {
        Object.keys(attributes).forEach((key) => {
            script.setAttribute(key, attributes[key]);
        });
    }

    return appendTagAsync(script, targetNode);
}

type AppendCssTagParams = {
    href: string;
    moduleId: string;
    targetNode: Node;
};

function appendCssTag({ href, moduleId, targetNode }: AppendCssTagParams) {
    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.setAttribute(DATA_APP_ID_ATTRIBUTE, moduleId);

    targetNode.appendChild(link);

    return appendTagAsync(link, targetNode);
}
