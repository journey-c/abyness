#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "CuTest.h"
#include "util/rbtree.h"

#define color_red "\x1b[1;31m%s\x1b[0m\n"
#define color_black "\x1b[1;34m%s\x1b[0m\n"

struct rb_root *map;

struct node {
  struct rb_node rb_node;
  char *key;
  void *value;
};

struct node *map_search(struct rb_root *root, char *key) {
  struct rb_node *pos = root->rb_node;
  while (pos) {
    struct node *data = container_of(pos, struct node, rb_node);
    int cmp = strcmp(key, data->key);
    if (cmp == 0) {
      return data;
    } else if (cmp > 0) {
      pos = pos->right;
    } else {
      pos = pos->left;
    }
  }
  return NULL;
}

void map_insert(struct rb_root *root, char *key, void *value) {
  struct rb_node *p = NULL;
  struct rb_node *pos = root->rb_node;
  while (pos) {
    p = pos;
    struct node *data = container_of(pos, struct node, rb_node);
    int cmp = strcmp(key, data->key);
    if (cmp == 0) {
      data->value = value;
      return;
    } else if (cmp > 0) {
      pos = pos->right;
    } else {
      pos = pos->left;
    }
  }

  struct node *new_node = (struct node *)malloc(sizeof(struct node));
  new_node->key = key;
  new_node->value = value;
  new_node->rb_node.left = NULL;
  new_node->rb_node.right = NULL;
  rb_set_red(&new_node->rb_node);

  if (!p) {
    root->rb_node = &new_node->rb_node;
  } else {
    int cmp = strcmp(key, container_of(p, struct node, rb_node)->key);
    if (cmp > 0) {
      p->right = &new_node->rb_node;
    } else if (cmp < 0) {
      p->left = &new_node->rb_node;
    }
    rb_set_parent(&new_node->rb_node, p);
  }

  rb_insert_color(root, &new_node->rb_node);
}

void map_erase(struct rb_root *root, char *key) {
  struct rb_node *erase_node = &map_search(root, key)->rb_node;
  rb_erase(root, erase_node);
  return;
}

void print(struct rb_node *node, int layer) {
  if (!node) {
    return;
  }

  print(node->right, layer + 1);

  /* if (rb_parent(node)) { */
  /* if (node == rb_parent(node)->left && */
  /* strcmp(container_of(node, struct node, rb_node)->key, */
  /* container_of(rb_parent(node), struct node, rb_node)->key) > 0) { */
  /* printf("*** "); */
  /* } */
  /* printf("%s -> %s : %s\n", container_of(node, struct node, rb_node)->key, */
  /* container_of(rb_parent(node), struct node, rb_node)->key, */
  /* (node == rb_parent(node)->left) ? "left" : "right"); */
  /* } else { */
  /* printf("%s -> NULL\n", container_of(node, struct node, rb_node)->key); */
  /* } */
  for (int i = 0; i < layer; i++) {
    printf("\t");
  }
  if (rb_is_red(node)) {
    printf(color_red, container_of(node, struct node, rb_node)->key);
  } else {
    printf(color_black, container_of(node, struct node, rb_node)->key);
  }

  print(node->left, layer + 1);
  return;
}

void TestRbTree(CuTest *tc) {
  map = &RB_ROOT;
  int input[21] = {383, 886, 777, 915, 793, 335, 386, 492, 649, 421, 362,
                   27,  690, 59,  763, 926, 540, 426, 172, 736, 211};
  for (int i = 0; i <= 20; i++) {
    char *key = (char *)malloc(sizeof(char) * 4);
    sprintf(key, "%d", input[i]);
    map_insert(map, key, &input[i]);
    /* printf("====== insert %d ======\n", input[i]); */
    /* printf("level:\t1\t2\t3\t4\t5\t6\t7\t8\t...\n"); */
    /* print(map->rb_node, 1); */
  }
  printf("=== insert finish ===\n");

  printf("level:\t1\t2\t3\t4\t5\t6\t7\t8\t...\n");
  print(map->rb_node, 1);

  for (int i = 0; i <= 20; i++) {
    char *key = (char *)malloc(sizeof(char) * 4);
    sprintf(key, "%d", input[i]);
    printf("====== erase %d ======\n", input[i]);
    map_erase(map, key);
    printf("level:\t1\t2\t3\t4\t5\t6\t7\t8\t...\n");
    print(map->rb_node, 1);
  }
}

int main(void) {
  CuString *output = CuStringNew();
  CuSuite *suite = CuSuiteNew();

  /* SUITE_ADD_TEST(suite, TestNetSetError); */
  SUITE_ADD_TEST(suite, TestRbTree);

  CuSuiteRun(suite);
  CuSuiteSummary(suite, output);
  CuSuiteDetails(suite, output);
  printf("%s ", output->buffer);
  CuStringDelete(output);
  CuSuiteDelete(suite);
  return 0;
}
