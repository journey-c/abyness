#ifndef _RBTREE_H_
#define _RBTREE_H_

#include <stdint.h>

#define RB_RED 0
#define RB_BLACK 1

struct rb_node {
  struct rb_node *p;
  uint8_t color;
  void *key;
  struct rb_node *left;
  struct rb_node *right;
};

struct rbtree {
  struct rb_node *root;
  struct rb_node *nil;
};

extern struct rbtree *new_rbtree();
extern void left_rotate(struct rbtree *rb, struct rb_node *x);
extern void left_rotate(struct rbtree *rb, struct rb_node *x);
extern void rb_insert(struct rbtree *rb, struct rb_node *z);
extern void rb_delete(struct rbtree *rb, struct rb_node *z);

#endif /* _RBTREE_H_ */
