FROM node:24 AS installer
COPY . /test-shop
WORKDIR /test-shop
RUN npm install -g typescript@^6.0.3
RUN npm install --omit=dev
RUN npm dedupe --omit=dev
RUN rm -rf frontend/node_modules
RUN rm -rf frontend/.angular
RUN rm -rf frontend/src/assets
RUN mkdir logs
RUN chown -R 65532 logs
RUN chgrp -R 0 ftp/ frontend/dist/ logs/ data/ i18n/
RUN chmod -R g=u ftp/ frontend/dist/ logs/ data/ i18n/
RUN rm ftp/legal.md || true
RUN rm i18n/*.json || true

ARG CYCLONEDX_NPM_VERSION='^2.0.0||^3.0.0||^4.0.0'
RUN npm install -g @cyclonedx/cyclonedx-npm@$CYCLONEDX_NPM_VERSION
RUN npm run sbom

FROM gcr.io/distroless/nodejs24-debian13
ARG BUILD_DATE
ARG VCS_REF
LABEL org.opencontainers.image.title="Test Shop" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.version="20.4.0-SNAPSHOT" \
    org.opencontainers.image.revision=$VCS_REF \
    org.opencontainers.image.created=$BUILD_DATE
WORKDIR /test-shop
COPY --from=installer --chown=65532:0 /test-shop .
USER 65532
EXPOSE 3000
CMD ["/test-shop/build/app.js"]
