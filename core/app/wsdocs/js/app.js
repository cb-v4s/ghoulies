
    const schema = {
  "asyncapi": "2.0.0",
  "info": {
    "title": "Ghosties",
    "version": "1.0.0",
    "description": "WebSocket API Docs"
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
    "/": {
      "description": "Room-related events",
      "publish": {
        "description": "Send messages to the API",
        "operationId": "sendMessages",
        "message": {
          "oneOf": [
            {
              "summary": "Updates user's positions in the map",
              "payload": {
                "type": "object",
                "required": [
                  "event",
                  "data"
                ],
                "properties": {
                  "event": {
                    "type": "string",
                    "const": "updatePosition",
                    "x-parser-schema-id": "<anonymous-schema-1>"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "userId": {
                        "type": "string",
                        "description": "The ID of the user",
                        "example": "334288",
                        "x-parser-schema-id": "<anonymous-schema-3>"
                      },
                      "roomId": {
                        "type": "string",
                        "description": "The ID of the room",
                        "example": "keep the block hot#0",
                        "x-parser-schema-id": "<anonymous-schema-4>"
                      },
                      "dest": {
                        "type": "string",
                        "description": "A string that contains row and col separated by a comma",
                        "example": "3,3",
                        "x-parser-schema-id": "<anonymous-schema-5>"
                      }
                    },
                    "x-parser-schema-id": "<anonymous-schema-2>"
                  }
                },
                "x-parser-schema-id": "updatePosition"
              },
              "x-response": {
                "type": "object",
                "required": [
                  "event",
                  "data"
                ],
                "properties": {
                  "event": {
                    "type": "string",
                    "const": "updateScene",
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "users": {
                        "type": "array",
                        "description": "A list of objects containing user's ids, names and positions in the map",
                        "example": [
                          {
                            "UserName": "Alice",
                            "UserID": "334288",
                            "RoomID": "keep the block hot#0",
                            "Position": {
                              "Row": 3,
                              "Col": 5
                            },
                            "Direction": -1
                          }
                        ],
                        "x-parser-schema-id": "<anonymous-schema-21>"
                      },
                      "roomId": {
                        "type": "string",
                        "description": "The ID of the room",
                        "example": "keep the block hot#0",
                        "x-parser-schema-id": "<anonymous-schema-22>"
                      }
                    },
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  }
                },
                "x-parser-schema-id": "updateScene"
              },
              "x-parser-message-name": "updatePosition"
            },
            {
              "summary": "Join a chat room",
              "payload": {
                "type": "object",
                "required": [
                  "event",
                  "data"
                ],
                "properties": {
                  "event": {
                    "type": "string",
                    "const": "joinRoom",
                    "x-parser-schema-id": "<anonymous-schema-6>"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "roomId": {
                        "type": "string",
                        "description": "The ID of the room",
                        "example": "keep the block hot#0",
                        "x-parser-schema-id": "<anonymous-schema-8>"
                      },
                      "userName": {
                        "type": "string",
                        "description": "user's chosen name",
                        "example": "Alice",
                        "x-parser-schema-id": "<anonymous-schema-9>"
                      }
                    },
                    "x-parser-schema-id": "<anonymous-schema-7>"
                  }
                },
                "x-parser-schema-id": "joinRoom"
              },
              "x-response": {
                "oneOf": [
                  "$ref:$.channels./.publish.message.oneOf[0].x-response",
                  {
                    "type": "object",
                    "required": [
                      "event",
                      "data"
                    ],
                    "properties": {
                      "event": {
                        "type": "string",
                        "const": "setUserId",
                        "x-parser-schema-id": "<anonymous-schema-23>"
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "userId": {
                            "type": "string",
                            "description": "User's id",
                            "x-parser-schema-id": "<anonymous-schema-25>"
                          }
                        },
                        "x-parser-schema-id": "<anonymous-schema-24>"
                      }
                    },
                    "x-parser-schema-id": "setUserId"
                  }
                ]
              },
              "x-parser-message-name": "joinRoom"
            },
            {
              "summary": "Create a chat room",
              "payload": {
                "type": "object",
                "required": [
                  "event",
                  "data"
                ],
                "properties": {
                  "event": {
                    "type": "string",
                    "const": "newRoom",
                    "x-parser-schema-id": "<anonymous-schema-10>"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "roomName": {
                        "type": "string",
                        "description": "The name of the room",
                        "example": "my new room",
                        "x-parser-schema-id": "<anonymous-schema-12>"
                      },
                      "userName": {
                        "type": "string",
                        "description": "user's chosen name",
                        "example": "Alice",
                        "x-parser-schema-id": "<anonymous-schema-13>"
                      }
                    },
                    "x-parser-schema-id": "<anonymous-schema-11>"
                  }
                },
                "x-parser-schema-id": "newRoom"
              },
              "x-response": {
                "oneOf": [
                  "$ref:$.channels./.publish.message.oneOf[0].x-response",
                  "$ref:$.channels./.publish.message.oneOf[1].x-response.oneOf[1]"
                ]
              },
              "x-parser-message-name": "newRoom"
            },
            {
              "summary": "broadcast a message in a room",
              "payload": {
                "type": "object",
                "required": [
                  "event",
                  "data"
                ],
                "properties": {
                  "event": {
                    "type": "string",
                    "const": "broadcastMessage",
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "from": {
                        "type": "string",
                        "description": "The ID of the user",
                        "example": "334288",
                        "x-parser-schema-id": "<anonymous-schema-16>"
                      },
                      "roomId": {
                        "type": "string",
                        "description": "The ID of the room",
                        "example": "keep the block hot#0",
                        "x-parser-schema-id": "<anonymous-schema-17>"
                      },
                      "msg": {
                        "type": "string",
                        "description": "Text message",
                        "example": "Hello world!",
                        "x-parser-schema-id": "<anonymous-schema-18>"
                      }
                    },
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  }
                },
                "x-parser-schema-id": "broadcastMessage"
              },
              "x-response": "$ref:$.channels./.publish.message.oneOf[3].payload",
              "x-parser-message-name": "broadcastMessage"
            }
          ]
        }
      },
      "subscribe": {
        "description": "Messages Received from the API",
        "operationId": "ReceiveMessages",
        "message": {
          "oneOf": [
            {
              "summary": "Updates map",
              "payload": "$ref:$.channels./.publish.message.oneOf[0].x-response",
              "x-parser-message-name": "updateScene"
            },
            "$ref:$.channels./.publish.message.oneOf[3]"
          ]
        }
      }
    }
  },
  "components": {
    "messages": {
      "updatePosition": "$ref:$.channels./.publish.message.oneOf[0]",
      "updateScene": "$ref:$.channels./.subscribe.message.oneOf[0]",
      "joinRoom": "$ref:$.channels./.publish.message.oneOf[1]",
      "newRoom": "$ref:$.channels./.publish.message.oneOf[2]",
      "broadcastMessage": "$ref:$.channels./.publish.message.oneOf[3]"
    },
    "schemas": {
      "broadcastMessage": "$ref:$.channels./.publish.message.oneOf[3].payload",
      "joinRoom": "$ref:$.channels./.publish.message.oneOf[1].payload",
      "newRoom": "$ref:$.channels./.publish.message.oneOf[2].payload",
      "updatePosition": "$ref:$.channels./.publish.message.oneOf[0].payload",
      "updateScene": "$ref:$.channels./.publish.message.oneOf[0].x-response",
      "setUserId": "$ref:$.channels./.publish.message.oneOf[1].x-response.oneOf[1]"
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
  