#include "front.h"

#include <stdio.h>
#include <unistd.h>

int main(int argc, char **argv) {
    front_listen("127.0.0.1", 7000);
    return 0;
}
