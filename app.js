// create virtual node
function h(tag, props, children) {
    return {
        tag,
        props,
        children,
    }
}

// mount virtual node to container
function mount(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.tag))
    for (const key in vnode.props) {
        if (key === "events") {
            for (const e in vnode.props.events) {
                el.addEventListener(e, vnode.props.events[e]);
            }
        } else {
            el.setAttribute(key, vnode.props[key]);
        }
    }

    if (typeof vnode.children === "string") {
        el.textContent = vnode.children;
    } else {
        vnode.children.forEach(child => {
            mount(child, el);
        })
    }
    container.append(el);
}

// unmount mounted vnode
function unmount(vnode) {
    vnode.el.parentNode.removeChild(vnode.el);
}


function patch(n1, n2) {
    const el = (n2.el = n1.el);
    if (n1.tag !== n2.tag) {
        mount(n2, el.parentNode);
        unmount(n1);
    } else {
        if (typeof n2.children === "string") {
            el.textContent = n2.children;
            return;
        }

        const c1 = n1.children;
        const c2 = n2.children;
        const commonLength = Math.min(c1.length, c2.length);
        for (let i = 0; i < commonLength; i++) {
            patch(c1[i], c2[i]);
        }

        if (c1.length > c2.length) {
            c1.slice(c2.length).forEach(child => {
                unmount(child);
            })
        }

        if (c2.length > c1.length) {
            c2.slice(c1.length).forEach(child => {
                mount(child, el);
            })
        }
    }

}

let activeEffect = null;
function watchEffect(fn) {
    activeEffect = fn
    fn()
    activeEffect = null;
}

class Dep {
    subscribers = new Set()
    depend() {
        if (activeEffect) {
            this.subscribers.add(activeEffect)
        }
    }
    notify() {
        this.subscribers.forEach(subscriber => subscriber());
    }
}

function reactive(obj) {
    Object.keys(obj).forEach(key => {
        const dep = new Dep();
        let value = obj[key]
        Object.defineProperty(obj, key, {
            get() {
                dep.depend();
                return value;
            },
            set(val) {
                value = val;
                dep.notify();
            }
        })
    })
    return obj;
}

function increaseCount() {
    state.count++;
}

function render(clickCount) {
    return h(
        'div',
        { class: "container" },
        [
            h('h1', null, clickCount),
            h('p', null, 'clicks'),
            h(
                'button',
                {
                    events: {
                        click: increaseCount,
                    }
                },
                'click')
        ]
    )
}

const state = reactive({
    count: 0,
})

let previousNode = null;
watchEffect(() => {
    if (!previousNode) {
        previousNode = render(String(state.count))
        mount(previousNode, document.querySelector('#app'))
    } else {
        const newVNode = render(String(state.count))
        patch(previousNode, newVNode)
        previousNode = newVNode;
    }
})
