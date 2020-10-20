#include "util/rbtree.h"
#include <stdlib.h>

struct rbtree *new_rbtree() {
  struct rbtree *rb = (struct rbtree *)malloc(sizeof(struct rbtree));
  rb->nil = (struct rb_node *)malloc(sizeof(struct rb_node));
  rb->nil->color = RB_BLACK;
  rb->root = rb->nil;
  return rb;
}

/*     |                            |
 *     y                            x
 *    / \   <--- left rotate ---   / \
 *   x   γ  --- right rotate ---> α   y
 *  / \                              / \
 * α   β                            β   γ
 */
void left_rotate(struct rbtree *rb, struct rb_node *x) {
  if (rb == NULL || x == NULL) {
    return;
  }
  struct rb_node *y = x->right;
  x->right = y->left;
  if (y->left != rb->nil) {
    y->left->p = x;
  }
  y->p = x->p;
  if (x->p == rb->nil) { // empty
    rb->root = y;
  } else if (x == x->p->left) {
    x->p->left = y;
  } else {
    x->p->right = y;
  }
  y->left = x;
  x->p = y;
  return;
}

void right_rotate(struct rbtree *rb, struct rb_node *y) {
  if (rb == NULL || y == NULL) {
    return;
  }
  struct rb_node *x = y->left;
  y->left = x->right;
  if (x->right != rb->nil) {
    x->right->p = y;
  }
  x->p = y->p;
  if (y->p == rb->nil) { // empty
    rb->root = x;
  } else if (y->p == y->p->left) {
    y->p->left = x;
  } else {
    y->p->right = x;
  }
  x->right = y;
  y->p = x;
  return;
}

void rb_insert_fixup(struct rbtree *rb, struct rb_node *z) {
  struct rb_node *y;
  while (z->p->color == RB_RED) {
    if (z->p == z->p->p->left) {
      y = z->p->p->left;
      if (y->color == RB_RED) {
        z->p->color = RB_BLACK;
        y->color = RB_BLACK;
        z->p->p->color = RB_RED;
      } else if (z == z->p->right) {
        z = z->p;
        left_rotate(rb, z);
      }
      z->p->color = RB_BLACK;
      z->p->p->color = RB_RED;
      right_rotate(rb, z);
    } else {
      // TODO: fix up
    }
    rb->root->color = RB_BLACK;
  }
  return;
}

void rb_insert(struct rbtree *rb, struct rb_node *z) {
  if (rb == NULL || z == NULL) {
    return;
  }
  struct rb_node *y = rb->nil;
  struct rb_node *x = rb->root;
  while (x != rb->nil) {
    y = x;
    if (z->key < x->key) {
      x = x->left;
    } else {
      x = x->right;
    }
  }
  if (y == rb->nil) {
    rb->root = z;
  } else if (z->key < y->key) {
    y->left = z;
  } else {
    y->right = z;
  }
  z->left = rb->nil;
  z->right = rb->nil;
  z->color = RB_RED;
  rb_insert_fixup(rb, z);
  return;
}
void rb_delete(struct rbtree *rb, struct rb_node *z) { return; }
