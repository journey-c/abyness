#ifndef _UTIL_RBTREE_H_
#define _UTIL_RBTREE_H_

#include <stdint.h>

#if defined(container_of)
#undef container_of
#define container_of(ptr, type, member)                    \
    ({                                                     \
        const typeof(((type *)0)->member) *__mptr = (ptr); \
        (type *)((char *)__mptr - offsetof(type, member)); \
    })
#else
#define container_of(ptr, type, member)                    \
    ({                                                     \
        const typeof(((type *)0)->member) *__mptr = (ptr); \
        (type *)((char *)__mptr - offsetof(type, member)); \
    })
#endif

#if defined(offsetof)
#undef offsetof
#define offsetof(TYPE, MEMBER) ((size_t) & ((TYPE *)0)->MEMBER)
#else
#define offsetof(TYPE, MEMBER) ((size_t) & ((TYPE *)0)->MEMBER)
#endif

struct rb_node {
    long rb_parent_color;
    struct rb_node *left;
    struct rb_node *right;
} __attribute__((aligned(sizeof(long))));

struct rb_root {
    struct rb_node *rb_node;
};

#define RB_RED 0
#define RB_BLACK 1

#define rb_parent(r) ((struct rb_node *)((r)->rb_parent_color & (~3)))
#define rb_color(r) ((r)->rb_parent_color & 1)
#define rb_is_red(r) (!rb_color(r))
#define rb_is_black(r) (rb_color(r))
#define rb_set_red(r) ((r)->rb_parent_color &= (~1))
#define rb_set_black(r) ((r)->rb_parent_color |= 1)

#define RB_ROOT \
    (struct rb_root) { NULL, }

static inline void rb_set_parent(struct rb_node *rb, struct rb_node *p) {
    rb->rb_parent_color = ((rb->rb_parent_color & 3) | (unsigned long)p);
    return;
}

static inline void rb_set_color(struct rb_node *rb, int color) {
    rb->rb_parent_color = (rb->rb_parent_color & ~1) | color;
    return;
}

extern void rb_init(struct rb_root *root);
extern void rb_insert_color(struct rb_root *root, struct rb_node *rb);
extern void rb_erase(struct rb_root *root, struct rb_node *rb);
extern struct rb_node *rb_next(struct rb_root *root, struct rb_node *rb);
extern struct rb_node *rb_prev(struct rb_root *root, struct rb_node *rb);
extern struct rb_node *rb_first(struct rb_root *root, struct rb_node *rb);
extern struct rb_node *rb_last(struct rb_root *root, struct rb_node *rb);

#endif /* _UTIL_RBTREE_H_ */
