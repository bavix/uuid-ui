FROM rtsp/lighttpd
COPY ./public /var/www/html/
EXPOSE 80/tcp
