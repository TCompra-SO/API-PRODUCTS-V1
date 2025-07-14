import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.handle";
import { RequestExt } from "./../interfaces/req-ext";
import { accessTokenName, csrfTokenName, secretInternalName } from "../globals";

// Verificar si solicitud proviene de otro de los servidores de TCompra
function checkTrust(req: RequestExt): boolean {
  if (process.env.INTERNAL_SECRET) {
    const secret = req.get(secretInternalName);
    if (secret === process.env.INTERNAL_SECRET) {
      return true;
    }
  }
  return false;
}

const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const isTrusted = checkTrust(req);

    if (!isTrusted) {
      // Double Submit Cookie
      const csrfCookieToken = req.cookies?.[csrfTokenName];
      const csrfHeaderToken = req.get(csrfTokenName);
      if (!csrfCookieToken || !csrfHeaderToken) {
        return res.status(401).send({
          success: false,
          code: 401,
          error: {
            msg: "NO_TIENES_UN_CSRF_TOKEN",
          },
        });
      }

      if (csrfCookieToken !== csrfHeaderToken) {
        return res.status(401).send({
          success: false,
          code: 401,
          error: {
            msg: "CSRF_TOKEN_INVALIDO",
          },
        });
      }
    }

    const jwt = isTrusted
      ? req.headers.authorization?.split(" ")[1] // Obtener el token después de "Bearer"
      : req.cookies?.[accessTokenName];
    if (!jwt) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    }

    const isUser = (await verifyToken(jwt)) as { id: string }; // Asegúrate de esperar la promesa

    if (!isUser) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    } else {
      req.user = isUser;

      next();
    }
  } catch (e) {
    res.status(400).send({
      success: false,
      code: 400,
      error: {
        msg: "NO_TIENES_UN_JWT_VALIDO",
      },
    });
  }
};

export { checkJwt };
