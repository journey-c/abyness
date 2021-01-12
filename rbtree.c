#include "util/rbtree.h"
#include <stdio.h>

struct node {
  struct rb_node rb_node;
  char *key;
  void *value;
};

static void rb_left_rotate(struct rb_root *root, struct rb_node *node) {
  struct rb_node *right = node->right;
  node->right = right->left;
  if (right->left) {
    rb_set_parent(right->left, node);
  }
  rb_set_parent(right, rb_parent(node));
  if (!rb_parent(node)) {
    root->rb_node = right;
  } else {
    if (node == rb_parent(node)->left) {
      rb_parent(node)->left = right;
    } else {
      rb_parent(node)->right = right;
    }
  }
  right->left = node;
  rb_set_parent(node, right);
  return;
}

static void rb_right_rotate(struct rb_root *root, struct rb_node *node) {
  struct rb_node *left = node->left;
  node->left = left->right;
  if (left->right) {
    rb_set_parent(left->right, node);
  }
  rb_set_parent(left, rb_parent(node));
  if (!rb_parent(node)) {
    root->rb_node = left;
  } else {
    if (node == rb_parent(node)->left) {
      rb_parent(node)->left = left;
    } else {
      rb_parent(node)->right = left;
    }
  }
  left->right = node;
  rb_set_parent(node, left);
  return;
}

void rb_insert_color(struct rb_root *root, struct rb_node *node) {
  struct rb_node *parent, *gparent;
  while ((parent = rb_parent(node)) && rb_is_red(rb_parent(node))) {
    gparent = rb_parent(parent);
    if (parent == gparent->left) {
      register struct rb_node *uncle = gparent->right;
      if (uncle && rb_is_red(uncle)) {  // case 1
        rb_set_black(parent);
        rb_set_black(uncle);
        rb_set_red(gparent);
        node = gparent;
      } else {
        if (node == parent->right) {  // case 2
          node = parent;
          rb_left_rotate(root, node);
          parent = rb_parent(node);
          gparent = rb_parent(parent);
        }
        rb_set_black(parent);  // case 3
        rb_set_red(gparent);
        rb_right_rotate(root, gparent);
      }
    } else {
      register struct rb_node *uncle = gparent->left;
      if (uncle && rb_is_red(uncle)) {  // case 4
        rb_set_black(parent);
        rb_set_black(uncle);
        rb_set_red(gparent);
        node = gparent;
      } else {
        if (node == parent->left) {  // case 5
          node = parent;
          rb_right_rotate(root, node);
          parent = rb_parent(node);
          gparent = rb_parent(parent);
        }
        rb_set_black(parent);  // case 6
        rb_set_red(gparent);
        rb_left_rotate(root, gparent);
      }
    }
  }
  rb_set_black(root->rb_node);
  return;
}

static void rb_erase_color(struct rb_root *root, struct rb_node *parent,
                           struct rb_node *node) {
  while ((!node || rb_is_black(node)) && node != root->rb_node) {
    if (node == parent->left) {
      register struct rb_node *uncle = parent->right;
      if (rb_is_red(uncle)) {  // case 1
        rb_set_black(uncle);
        rb_set_red(parent);
        rb_left_rotate(root, parent);
        uncle = parent->right;
      }
      if (uncle && (!uncle->left || rb_is_black(uncle->left)) &&
          (!uncle->right || rb_is_black(uncle->right))) {  // case 2
        rb_set_red(uncle);
        node = parent;
        parent = rb_parent(node);
      } else {
        if (!uncle->right || rb_is_black(uncle->right)) {  // case 3
          rb_set_black(uncle->left);
          rb_set_red(uncle);
          rb_right_rotate(root, uncle);
          uncle = parent->right;
        }
        rb_set_color(uncle, rb_color(parent));  // case 4
        rb_set_black(parent);
        rb_set_black(uncle->right);
        rb_left_rotate(root, parent);
        node = root->rb_node;
        parent = rb_parent(node);
      }
    } else {
      register struct rb_node *uncle = parent->left;
      if (rb_is_red(uncle)) {  // case 5
        rb_set_black(uncle);
        rb_set_red(parent);
        rb_right_rotate(root, parent);
        uncle = parent->left;
      }
      if ((!uncle->left || rb_is_black(uncle->left)) &&
          (!uncle->right || rb_is_black(uncle->right))) {  // case 6
        rb_set_red(uncle);
        node = parent;
        parent = rb_parent(node);
      } else {
        if (!uncle->left || rb_is_black(uncle->left)) {  // case 7
          rb_set_black(uncle->right);
          rb_set_red(uncle);
          rb_left_rotate(root, uncle);
          uncle = parent->left;
        }
        rb_set_color(uncle, rb_color(parent));  // case 8
        rb_set_black(parent);
        rb_set_black(uncle->left);
        rb_right_rotate(root, parent);
        node = root->rb_node;
        parent = rb_parent(node);
      }
    }
  }
  if (node) {
    rb_set_black(node);
  }
  return;
}

/*
 * rb_erase
 *
 */
void rb_erase(struct rb_root *root, struct rb_node *node) {
  struct rb_node *parent, *child;
  int color;
  if (!node->left) {
    child = node->right;
  } else if (!node->right) {
    child = node->left;
  } else {
    struct rb_node *old_node = node, *left;
    node = node->right;

    while ((left = node->left) != NULL) {
      node = node->left;
    }

    color = rb_color(node);
    child = node->right;

    if (rb_parent(old_node)) {
      /*
       *    p         p
       *    |         |
       *    o         n
       *   / \   ->  / \
       *      n         x
       *       \
       *        x
       */
      if (rb_parent(node) == old_node) {
        // move node
        node->left = old_node->left;
        if (node->left) {
          rb_set_parent(node->left, node);
        }

        if (old_node == rb_parent(old_node)->left) {
          rb_parent(old_node)->left = node;
        } else {
          rb_parent(old_node)->right = node;
        }
        rb_set_parent(node, rb_parent(old_node));
        rb_set_color(node, rb_color(old_node));

        parent = node;
        /*
         *    p          p
         *    |          |
         *    o          n
         *   / \        / \
         *      m          m
         *     / \ ->     / \
         *   ...        ...
         *   /          /
         *  n          x
         *   \        / \
         *    x
         */
      } else {
        // move child
        parent = rb_parent(node);
        parent->left = child;
        if (child) {
          rb_set_parent(child, parent);
        }

        // move node
        node->left = old_node->left;
        if (old_node->left) {
          rb_set_parent(old_node->left, node);
        }

        node->right = old_node->right;
        rb_set_parent(old_node->right, node);

        if (old_node == rb_parent(old_node)->left) {
          rb_parent(old_node)->left = node;
        } else {
          rb_parent(old_node)->right = node;
        }
        rb_set_parent(node, rb_parent(old_node));
        rb_set_color(node, rb_color(old_node));
      }
    } else {
      /*
       *    o         n
       *   / \   ->  / \
       *      n         x
       *       \
       *        x
       */
      if (rb_parent(node) == old_node) {
        // move node
        node->left = old_node->left;
        if (node->left) {
          rb_set_parent(node->left, node);
        }
        root->rb_node = node;
        rb_set_parent(node, NULL);
        rb_set_color(node, rb_color(old_node));

        parent = node;
        /*
         *    o          n
         *   / \        / \
         *      m          m
         *     / \ ->     / \
         *   ...        ...
         *   /          /
         *  n          x
         *   \        / \
         *    x
         */
      } else {
        // move child
        parent = rb_parent(node);
        parent->left = child;
        if (child) {
          rb_set_parent(child, parent);
        }

        // move node
        node->left = old_node->left;
        if (old_node->left) {
          rb_set_parent(old_node->left, node);
        }

        node->right = old_node->right;
        rb_set_parent(old_node->right, node);

        root->rb_node = node;
        rb_set_parent(node, NULL);
        rb_set_color(node, rb_color(old_node));
      }
    }

    goto color;
  }

  color = rb_color(node);
  parent = rb_parent(node);

  if (parent) {
    if (node == parent->left) {
      parent->left = child;
    } else {
      parent->right = child;
    }
    if (child) {
      rb_set_parent(child, parent);
    }
  } else {
    root->rb_node = child;
    if (child) {
      rb_set_parent(child, parent);
    }
  }

color:
  if (color == RB_BLACK) {
    rb_erase_color(root, parent, child);
  }

  return;
}

// next returns the next node (in sort order) of the tree.
struct rb_node *rb_next(struct rb_root *root, struct rb_node *rb) {
  if (rb->right) {
    return rb_first(root, rb->right);
  }
  struct rb_node *p = NULL;
  while (1) {
    if (!rb_parent(rb)) {
      break;
    }
    p = rb_parent(rb);
    if (rb == p->left) {
      break;
    }
    rb = p;
  }
  return p;
}

struct rb_node *rb_prev(struct rb_root *root, struct rb_node *rb) {
  if (rb->left) {
    return rb_last(root, rb->left);
  }
  struct rb_node *p = NULL;
  while (1) {
    if (!rb_parent(rb)) {
      break;
    }
    p = rb_parent(rb);
    if (rb == p->right) {
      break;
    }
    rb = p;
  }
  return p;
}

struct rb_node *rb_first(struct rb_root *root, struct rb_node *rb) {
  struct rb_node *res = rb;
  while (res->left) {
    res = res->left;
  }
  return res;
}

struct rb_node *rb_last(struct rb_root *root, struct rb_node *rb) {
  struct rb_node *res = rb;
  while (res->right) {
    res = res->right;
  }
  return res;
}
