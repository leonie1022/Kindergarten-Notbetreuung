FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql \
 && a2enmod rewrite \
 && sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Configure Apache to serve from backend/public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/backend/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri -e 's!Directory /var/www/!Directory ${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Copy backend code
COPY backend/ /var/www/html/backend/

EXPOSE 80
