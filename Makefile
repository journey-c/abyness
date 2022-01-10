
default:    build

clean:
	rm -rf Makefile objs

.PHONY: default clean

build:
	make -f objs/Makefile

install:
	make -f objs/Makefile install

.PHONY: build install
