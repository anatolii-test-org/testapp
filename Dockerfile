FROM node:12

RUN addgroup --gid 1001 --system app && adduser --uid 1001 --system --ingroup app --home /app app
COPY ./ /app/
RUN chown -R 1001:1001 /app
USER app
WORKDIR /app

RUN cd /app \
	&& npm install

EXPOSE 3200
CMD [ "npm", "start" ]
