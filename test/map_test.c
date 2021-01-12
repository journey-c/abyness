#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "CuTest.h"
#include "util/map.h"

#define color_red "\x1b[1;31m%s\x1b[0m "
#define color_black "\x1b[1;34m%s\x1b[0m "

int cmp(void *k1, void *k2) { return strcmp(k1, k2); }

char *to_string(int x) {
  if (x == 0) {
    char *ret = (char *)malloc(2);
    ret[0] = '0';
    ret[1] = 0;
    return ret;
  }
  int len = 0;
  int pos = x;
  while (pos) {
    len++;
    pos /= 10;
  }

  pos = x;
  char *ret = (char *)malloc(len + 1);
  ret[len] = 0;
  len--;
  while (pos) {
    ret[len] = pos % 10 + '0';
    pos /= 10;
    len--;
  }

  return ret;
}

void print(map *m, void *key, void *val) {
  printf("%s => %s\n", (char *)key, (char *)val);
}

void TestMapTree(CuTest *tc) {
  map *m = map_new(NULL, cmp);

  int ret;
  char err[1024];
  for (int i = 0; i < 100; i++) {
    char *str = to_string(i);
    ret = map_add(err, m, str, str);
    if (ret) {
      printf("%s\n", err);
    }
  }
  for (int i = 0; i < 100; i++) {
    char *str = to_string(i);
    ret = map_add(err, m, str, str);
    if (ret) {
      printf("%s\n", err);
    }
  }

  map_range(m, print);

  for (int i = 0; i < 100; i++) {
    char *str = to_string(i);
    map_remove(NULL, m, str);
  }

  map_range(m, print);

  map_free(m);
  return;
}

int main(void) {
  CuString *output = CuStringNew();
  CuSuite *suite = CuSuiteNew();

  /* SUITE_ADD_TEST(suite, TestNetSetError); */
  SUITE_ADD_TEST(suite, TestMapTree);

  CuSuiteRun(suite);
  CuSuiteSummary(suite, output);
  CuSuiteDetails(suite, output);
  printf("%s ", output->buffer);
  CuStringDelete(output);
  CuSuiteDelete(suite);
  return 0;
}
