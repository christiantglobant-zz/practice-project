// VARIABLES GLOBALES ===============================================================
var express = require('express');
var app = express(); //Crear nuestra aplicación w / express
var port = process.env.PORT || 3000; //Establecer el puerto
var users = require('./server/models/users.js'); //Modelo de usuarios
var supports = require('./server/models/supports.js');
var client = require('./server/models/client.js');
var contact = require('./server/models/contact.js');
var Helpers = require('./server/helpers/helpers.js');
var Messages = require('./server/lib/messages.js');
var http = require('https');
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
var sess = {
  user: {
    data: undefined
  }
};

var fs = require('fs');
var privateKey  = fs.readFileSync('D:/xampp/apache/conf/ssl-vulcanoappweb/vulcanoappweb.key', 'utf8');
var certificate = fs.readFileSync('D:/xampp/apache/conf/ssl-vulcanoappweb/certificado.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};



// CONFIGURACIÓN ===============================================================
var server = http.createServer(credentials,app);
var io = require('socket.io')(server);

app.use(session({
  secret: 'password secret',
  cookie: {
    maxAge: (3600000 * 12)
  }
}));

var bodyParserJson = bodyParser.json({
  type: 'application/json',
  limit: '50mb',
});

app.use(express.static('./')); //Establecer la ubicación de los archivos estáticos

/**
 * Usuarios Onlines
 * @type {Array}
 */
var onLines = [];

io.on('connection', function (socket) {
  console.log('El nodo con IP: ' + socket.handshake.address + ' Conectado');

  socket.on('io-refrehs-onlines', function (user) {
    updateOnlines(onLines);
  });

  socket.on('io-server-login', function (user) {
    socket.user = user;
    var search = false;
    if (onLines.length >= 1 && onLines.hasOwnProperty('_id')) {
      onLines.forEach(function (element, index) {
        if (typeof element === "object" && typeof user === "object" && element !== null && user !== null && element !== undefined && user !== undefined && element.length >= 0)
          if (element._id != undefined && element._id != '' && element._id != null && user._id != undefined && user._id != '' && user._id != null)
            if (element._id === user._id)
              search = true;
      });
    }
    if (search === false)
      onLines.push(user);

    updateOnlines(onLines);
  });

  socket.on('io-server-logout', function (user) {
    onLines.forEach(function (element, index) {
      if (element._id === user._id)
        onLines.splice(index, 1);
    });
    updateOnlines(onLines);
  });

  socket.on('io-server-new-ser', function (data, user) {
    io.sockets.emit('io-message-new-user', data, user);
    io.sockets.emit('io-add-new-user', data);
  });

  socket.on('io-server-new-ticket', function (data, user) {
    //    io.sockets.emit('io-message-new-ticket', data, user);
    io.sockets.emit('io-add-new-ticket', data);
  });

  socket.on('io-server-new-response', function (data, ticket, user) {
    io.sockets.emit('io-add-new-response', data, ticket);
    io.sockets.emit('io-message-new-response', ticket);
  });

  socket.on('io-server-update-sticker', function (data, user) {
    io.sockets.emit('io-add-update-sticker', data);
  });

  socket.on('disconnect', function () {
    console.log('El nodo con IP: ' + socket.handshake.address + ' Desconectado');
    onLines = [];
    io.sockets.emit('io-advertise-login', onLines);
  });

  var updateOnlines = function (onlines) {
    io.sockets.emit('io-update-onlines', onLines);
  };

});


app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html')); //Llamado del index
  })
  .post('/server/logout', function (req, res) {
    req.session = undefined;
    sess.user.data = undefined;
    res.send(true);
  })
  .post('/server/newUser', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.name,
        req.body.lastname,
        req.body.tel,
        req.body.email,
        req.body.password
      ])) {
        users.newUser(req.body, req.session.user.data.user)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/updateUser', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.name,
        req.body.lastname,
        req.body.tel,
        req.body._id,
      ])) {
        users.update(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/updateClient', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.celular,
        req.body.digito_verif,
        req.body.email,
        req.body.identificacion,
        req.body.nomb_comercial,
        req.body.razon_social,
        req.body._id,
      ])) {
        client.update(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  /** actualizar **/
  .post('/server/disableClient', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.estado,
        req.body._id,
      ])) {
        client.disableClient(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/disableContact', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.estado,
        req.body._id,
      ])) {
        //res.send(req.body);
        contact.disableContact(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/updateContact', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.body.company,
          req.body.fullname,
          req.body.phones,
          req.body.email,
      ])) {
        contact.update(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/updateSupport', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.body.company,
          req.body.typeSupport,
          req.body.medium,
          req.body.category,
          req.body.responsible,
          req.body.imputability,
          req.body.priority,
          req.body.affair,
          req.body.description
      ])) {
        supports.updateSupport(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/changePassword', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.password
      ])) {
        users.changePassword(req.body.password, req.session.user.data._id)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/newClient', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.nit,
        req.body.cod,
        req.body.business_name,
        req.body.tradename,
        req.body.mail,
        req.body.phone,
      ])) {
        client.newClient(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/allClients', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      client.allClients()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getUsers', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      users.allusers()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })

  .post('/server/login', function (req, res) {
    sess = req.session;
    users.verifyCredentials(req.query.username, req.query.password)
      .then(function (data) {
        req.session.user = data;
        var hour = (3600000 * 12);
        req.session.cookie.expires = new Date(Date.now() + hour);
        req.session.cookie.maxAge = hour;
        res.send(data);
      });
  })
  .post('/server/saveSupport', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.body.company,
          req.body.typeSupport,
          req.body.medium,
          req.body.category,
          req.body.responsible,
          req.body.imputability,
          req.body.dateRequest,
          req.body.priority,
          req.body.affair,
          req.body.description
        ])) {
        supports.saveSupport(req.body, req.session.user.data._id)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/newSupportDetalls', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.body.sticker,
          req.body.response
        ])) {
        req.body.username = req.session.user.data._id;
        supports.newSupportDetalls(req.body)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/newConct', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.company,
          req.query.fullname,
          req.query.phones,
          req.query.email,
        ])) {
        supports.newConct(req.query)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/newConctComp', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.company,
          req.query.fullname,
          req.query.phones,
          req.query.email,
        ])) {
        contact.newConct(req.query)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/changeStatusTicket', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.status,
          req.query.ticket
        ])) {
        if (req.query.status !== "NUEVO") {
          supports.changeStatusTicket(req.query, req.session.user.data)
            .then(function (data) {
              res.send(data);
            });
        } else {
          res.send({
            data: false,
            event: false,
            msj: "Error, No se puede cambiar el esta a nuevo!"
          });
        }
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/changeUserTicket', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.ticket,
          req.query.user,
          req.query.response
        ])) {
        supports.changeUserTicket(req.query)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/changePriority', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.ticket,
          req.query.priority,
          req.query.response
        ])) {
        supports.changePriority(req.query)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getContactComp', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([req.query.id])) {
        supports.getContactComp(req.query)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })

  .post('/server/allSupport', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      supports.allSupport()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getHistory', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      supports.getHistory()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getTotalSuports', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      supports.getTotalSuports()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getTotalSuportsMeses', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      supports.getTotalSuportsMeses()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getTotalSuportsResult', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.init,
          req.query.finis
        ])) {
        supports.getTotalSuportsResult(req.query)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }



    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/allUsuarios', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      users.allusers()
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/allClientes', function (req, res) {
    supports.allClientes()
      .then(function (data) {
        res.send(data);
      });
  })
  .post('/server/getAllContact', function (req, res) {
    contact.getAllContact()
      .then(function (data) {
        res.send(data);
      });
  })
  .post('/server/infoTickets', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.sticker
        ])) {
        supports.infoTickets(req.query.sticker)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/infoTicketsEdits', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.idem
        ])) {
        supports.infoTicketsEdits(req.query.idem)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getInfoClient', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
          req.query.idem
        ])) {
        client.getInfoClient(req.query.idem)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/getresponse', function (req, res) {
    supports.getresponse(req.query.sticker)
      .then(function (data) {
        res.send(data);
      });
  })
  .post('/server/verifySession', function (req, res) {
    var result = false;
    if (req.session)
      if (typeof req.session.user === 'object')
        if (req.session.user.data.user === req.query.username)
          if (new Date(req.session.user.data.lastlogin) <= req.session.cookie.expires)
            result = true;

    res.send(result);
  })
  .post('/server/updateShareTicket', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      if (Helpers.emptyDatas([
        req.body.number,
        req.body._id
      ])) {
        supports.updateShareTicket(req.body, req.session.user.data.user)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/loadChangesSupports', function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      supports.loadChanges(req.session.user.data._id)
        .then(function (data) {
          res.send(data);
        });
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/markViewed', bodyParserJson, function (req, res) {
    if (req.session && typeof req.session.user === 'object') {
      req.body.inbox = req.body.inbox || [];
      req.body.inbox = typeof req.body.inbox === "string" ? [req.body.inbox] : req.body.inbox;
      if (Helpers.emptyDatas(req.body.inbox)) {
        supports.markViewed(req.body.inbox, req.session.user.data._id)
          .then(function (data) {
            res.send(data);
          });
      } else {
        res.send({
          event: false,
          data: "global.error.required",
          msj: Messages.global.error.required
        });
      }
    } else {
      res.send({
        event: false,
        data: 'global.error.loginRequired',
        msj: Messages.global.error.loginRequired
      });
    }
  })
  .post('/server/logout', function (req, res) {
    req.session = undefined;
    res.send(true);
  });

// Listen (inicia la aplicación con el nodo server.js) ======================================
server.listen(3000, function () {
  var addr = server.address();
  console.log("Soporte server listening at", addr.address + ":" + addr.port);
});
