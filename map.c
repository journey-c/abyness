#include "util/map.h"
#include "util/rbtree.h"

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct map_node {
  struct rb_node rb_node;
  void *key, *val;
};

struct map {
  struct rb_root root;
  int (*cmp)(void *, void *);
};

static int map_cmp(struct map *m, void *k1, void *k2) {
  if (m->cmp) {
    return m->cmp(k1, k2);
  }
  if (k1 < k2) {
    return -1;
  } else if (k1 > k2) {
    return 1;
  } else {
    return 0;
  }
}

static struct map_node *map_search(struct map *m, void *key) {
  struct rb_node *pos = m->root.rb_node;
  int ret;
  while (pos) {
    ret = map_cmp(m, key, container_of(pos, struct map_node, rb_node)->key);
    if (ret == 0) {
      return container_of(pos, struct map_node, rb_node);
    } else if (ret < 0) {
      pos = pos->left;
    } else {
      pos = pos->right;
    }
  }
  return NULL;
}

struct map *map_new(char *err, int (*cmp)(void *, void *)) {
  struct map *map = (struct map *)malloc(sizeof(struct map));
  if (map == NULL) {
    sprintf(err, "%s", strerror(errno));
    return NULL;
  }
  map->root = RB_ROOT;
  map->cmp = cmp;
  return map;
}

// TODO: replace recursion with stack
static void __map_range(map *m, struct rb_node *node,
                        void(func)(map *m, void *key, void *val)) {
  if (node == NULL) {
    return;
  }

  __map_range(m, node->left, func);

  func(m, container_of(node, struct map_node, rb_node)->key,
       container_of(node, struct map_node, rb_node)->val);

  __map_range(m, node->right, func);

  return;
}

static void __map_erase_node(map *m, void *key, void *val) {
  map_remove(NULL, m, key);
}

static void __map_clear(map *m) {
  __map_range(m, m->root.rb_node, __map_erase_node);
  return;
}

int map_add(char *err, map *m, void *key, void *val) {
  if (m == NULL) {
    sprintf(err, "%s", strerror(errno));
    return -1;
  }
  struct map_node *node = (struct map_node *)malloc(sizeof(struct map_node));
  if (node == NULL) {
    sprintf(err, "%s", strerror(errno));
    return -1;
  }

  node->key = key;
  node->val = val;
  node->rb_node.left = NULL;
  node->rb_node.right = NULL;
  rb_set_red(&node->rb_node);

  struct rb_node *parent = NULL, *pos = m->root.rb_node;
  int ret = 0;
  while (pos) {
    parent = pos;
    ret = map_cmp(m, key, container_of(pos, struct map_node, rb_node)->key);
    if (ret < 0) {
      pos = pos->left;
    } else if (ret > 0) {
      pos = pos->right;
    } else {  // replace
      container_of(pos, struct map_node, rb_node)->key = key;
      container_of(pos, struct map_node, rb_node)->key = val;
      return 0;
    }
  }
  if (parent) {
    if (ret < 0) {
      parent->left = &node->rb_node;
    } else if (ret > 0) {
      parent->right = &node->rb_node;
    }
  } else {
    m->root.rb_node = &node->rb_node;
  }
  rb_set_parent(&node->rb_node, parent);
  rb_insert_color(&m->root, &node->rb_node);
  return 0;
}

void map_remove(char *err, map *m, void *key) {
  if (m == NULL) {
    sprintf(err, "%s", strerror(errno));
    return;
  }

  struct map_node *node = map_search(m, key);
  if (node) {
    rb_erase(&m->root, &node->rb_node);
    free(node);
    return;
  }
  return;
}

void *map_lookup(char *err, map *m, void *key) {
  if (m == NULL) {
    sprintf(err, "%s", strerror(errno));
    return NULL;
  }

  struct map_node *node = map_search(m, key);
  if (node) {
    return node->val;
  }

  sprintf(err, "not found");
  return NULL;
}


// ascending order traversal
void map_range(map *m, void(func)(map *m, void *key, void *val)) {
  if (m == NULL) {
    return;
  }
  __map_range(m, m->root.rb_node, func);
  return;
}

void map_clear(map *m) {
  if (m == NULL) {
    return;
  }
  __map_clear(m);
  return;
}

void map_free(map *m) {
  if (m == NULL) {
    return;
  }
  __map_clear(m);
  free(m);
}
