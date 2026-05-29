FROM node:20-alpine
RUN npm install -g fdl-mcp-server@1.0.0
ENTRYPOINT ["fdl-mcp-server"]
