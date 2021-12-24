#include "front.h"

#include <stdio.h>
#include <unistd.h>

int main(int argc, char **argv) {
    front_listen("", 7000);
    return 0;
}
