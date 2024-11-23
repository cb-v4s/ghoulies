
    const schema = {
  "asyncapi": "2.0.0",
  "info": {
    "title": "Ghosties",
    "version": "1.0.0",
    "description": "This is a simple example of AsyncAPI documentation for a Go project."
  },
  "servers": {
    "development": {
      "url": "ws://localhost:8000/ws",
      "protocol": "ws"
    },
    "production": {
      "url": "ws://localhost:8000/ws",
      "protocol": "ws"
    }
  },
  "channels": {
    "room": {
      "description": "room-related events",
      "subscribe": {
        "summary": "Updates the user's position in the map",
        "operationId": "updatePosition",
        "message": {
          "contentType": "application/json",
          "payload": {
            "type": "object",
            "properties": {
              "userId": {
                "type": "string",
                "description": "The ID of the user",
                "x-parser-schema-id": "<anonymous-schema-2>"
              },
              "roomId": {
                "type": "string",
                "description": "The ID of the room",
                "x-parser-schema-id": "<anonymous-schema-3>"
              },
              "Dest": {
                "type": "string",
                "enum": [
                  "active",
                  "inactive"
                ],
                "examples": [
                  {
                    "payload": {
                      "userId": "334288",
                      "roomId": "keep the block hot#0",
                      "Dest": "3,3"
                    }
                  }
                ],
                "x-parser-schema-id": "<anonymous-schema-4>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-1>"
          },
          "x-parser-message-name": "<anonymous-message-1>"
        }
      }
    }
  },
  "x-parser-spec-parsed": true,
  "x-parser-api-version": 3,
  "x-parser-spec-stringified": true
};
    const config = {"show":{"sidebar":true},"sidebar":{"showOperations":"byDefault"}};
    const appRoot = document.getElementById('root');
    AsyncApiStandalone.render(
        { schema, config, }, appRoot
    );
  