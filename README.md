
四层: tcp, udp transport layer
  |
  V
七层: http, https, mail  application layer

server {

}

transport {
    app {
        listen 80;
        servername test.com;
    }
    app {

    }
}
