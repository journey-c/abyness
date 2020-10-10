#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "CuTest.h"
#include "net.h"

void TestNetTcpServer(CuTest *tc) {
  char err[256];
  int res = net_tcp_server(err, 8360, "0.0.0.0", 5);
  printf("%s %d\n", err, res);
}

int main(void) {
  CuString *output = CuStringNew();
  CuSuite *suite = CuSuiteNew();

  /* SUITE_ADD_TEST(suite, TestNetSetError); */
  SUITE_ADD_TEST(suite, TestNetTcpServer);

  CuSuiteRun(suite);
  CuSuiteSummary(suite, output);
  CuSuiteDetails(suite, output);
  printf("%s ", output->buffer);
  CuStringDelete(output);
  CuSuiteDelete(suite);
  return 0;
}
