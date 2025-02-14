import { PurchaseOrderI } from "../interfaces/purchaseOrder.interface";

export const OrderPurchaseTemplate = async (
  data: Omit<PurchaseOrderI, "uid">
) => {
  const convertDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Los meses comienzan desde 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const createDate = convertDate(data.createDate);
  let deliveryDate = "";
  if (data.deliveryDate) {
    deliveryDate = convertDate(data.deliveryDate);
  }

  const template = `
    <!DOCTYPE html>
    <html class="no-js" lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;700&display=swap" rel="stylesheet">
      </head>
      <body style="background-color: #fdf0f7; margin: 0; font-family: 'Jost', sans-serif;">

      <table align="center" width="100%" style="max-width:800px" cellpadding="0" cellspacing="0">
      <tbody>
          <tr>
              <td style="background:#510839;padding:30px;text-align:center;border-radius:1rem 1rem 0 0">
                  <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/logo-white_qbdapd.png" alt="Logo Tcompra.com" height="80px" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0.">
              </td>
          </tr>
          <tr>
              <td style="background:#f7e9f1;color:#510839;padding:30px;text-align:center">
                  <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549506/orden-compra_qgnmwz.png" style="width:44px" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0.">
                  
                    <h1 style="margin:0;font-size:30px;line-height:1">Orden de Compra</h1>
                  
              </td>
          </tr>
          <tr>
              <td style="background:#fff;padding:30px">
                
                  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px">
                    <tbody><tr>
                      
                        <td><span style="color:#000000"><b>Felicidades,</b> su orden de compra se generó exitosamente.</span></td>
                      
                    </tr>
                  </tbody></table>
                
                  <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;border:2px solid #ebe5eb;border-radius:0.6rem;padding:15px;margin-bottom:10px">
                      <tbody><tr style="vertical-align:top">
                          <td style="text-align:justify">
                              <b style="color:#510839">Comprador principal</b><br>
                              <b style="color:#510839">${
                                data.userNameClient
                              }</b><br>
                             <span style="color:#000000"> ${
                               data.addressClient
                             }</span><br>
                              <a href="mailto:${
                                data.emailClient
                              }" target="_blank">${data.emailClient}</a><br>
                              <span style="color:#000000"> ${
                                data.documentClient.length > 8 ? "RUC" : "DNI"
                              }: ${data.documentClient}</span>

                              ${
                                data.userClientID !== data.subUserClientID
                                  ? `
                              <br><br><b style="color:#510839">Comprador</b><br>
                              <span style="color:#000000"> ${data.nameSubUserClient}</span><br>
                               <a href="mailto:${data.subUserClientEmail}" target="_blank">${data.subUserClientEmail}</a>
                               `
                                  : ""
                              }
                              
                          </td>
                          <td style="text-align:right">
                              
                              <b style="color:#510839">Fecha de Emisión:</b> ${createDate}<br>
                              
                              ${
                                data.deliveryDate
                                  ? `<b style="color: #510839;">Fecha de Entrega:</b> ${deliveryDate}`
                                  : ""
                              }
                              
                          </td>
                      </tr>                                
                  </tbody></table>
                  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px;font-size:14px">
                      <tbody><tr>
                          <td style="background:#fbedf5;border-radius:0.6rem;color:#bc1373;padding:10px;font-weight:800;text-align:center">Detalles</td>
                      </tr>
                  </tbody></table>
                  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px;font-size:14px">
                      <tbody>
                          <tr>
                              <td style="background:#fbedf5;color:#bc1373;font-weight:800;padding:10px;border-radius:0.6rem 0 0 0">Nombre</td>
                              <td style="background:#fbedf5;color:#bc1373;font-weight:800;padding:10px">Correo</td>
                              <td style="background:#fbedf5;color:#bc1373;font-weight:800;padding:10px">Fecha</td>
                              <td style="background:#fbedf5;color:#bc1373;font-weight:800;padding:10px;border-radius:0 0.6rem 0 0">Precio</td>
                          </tr>
                          <tr>
                              <td style="padding:10px;background:#fbfafb"><span style="color:#000000">${
                                data.offerTitle
                              }</span></td>
                              <td style="padding:10px;background:#fbfafb"><a href="mailto:${
                                data.emailProvider
                              }" target="_blank">${data.emailProvider}</a></td>
                              <td style="padding:10px;background:#fbfafb"><span style="color:#000000">${createDate}</span></td>
                              <td style="padding:10px;background:#fbfafb"><span style="color:#000000">${
                                data.currency
                              } ${data.total}</span></td>
                          </tr>
                      </tbody>
                  </table>
                  <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;border:2px solid #ebe5eb;border-radius:0.6rem;padding:15px;margin-bottom:10px">
                      <tbody><tr style="vertical-align:top">
                          <td style="text-align:justify">
                              <b style="color:#510839">Gracias por confiar en nosotros.</b><br><br>
                              <b style="color:#510839">Información del Proveedor</b><br>
                              <b style="color:#510839">Proveedor: </b><span style="color:#000000">${
                                data.nameUserProvider
                              }</span><br>
                              <b style="color:#510839">Domicilio: </b><span style="color:#000000">${
                                data.addressProvider
                              }</span><br>
                              <b style="color:#510839">${
                                data.documentProvider.length > 8 ? "RUC" : "DNI"
                              }: </b><span style="color:#000000">${
    data.documentProvider
  }</span><br>
                              <b style="color:#510839">Correo:</b> <a href="mailto:${
                                data.emailProvider
                              }" target="_blank">${data.emailProvider}</a>
                              
                               ${
                                 data.nameSubUserProvider !==
                                 data.nameUserProvider
                                   ? `
        <br>
        <br>
        <b style="color:#510839">Información del Usuario Proveedor</b><br>
        <b style="color:#510839">Usuario: </b>
        <span style="color:#000000">${data.nameSubUserProvider}</span><br>

        <b style="color:#510839">Correo:</b> 
        <a href="mailto:${data.subUserEmailProvider}" target="_blank">${data.subUserEmailProvider}</a>
      `
                                   : ""
                               }
                                   
                          </td>
                          <td style="text-align:right">
                              <b style="color:#510839">Sub Total:</b><br>
                              <b style="color:#510839">I.G.V.(${
                                data.igv
                              }%):</b><br>
                              <div style="color:transparent">.</div>
                              <b style="color:#510839;font-size:17px">Total:</b>
                          </td>
                          <td style="text-align:right">
                              <b style="color:#510839">${data.currency} ${
    data.subtotal
  }<br>
                              <b style="color:#510839">${data.currency} ${
    data.totaligv
  }</b><br>
                              <div style="color:#510839">........................</div>
                              <b style="color:#510839;font-size:17px">${
                                data.currency
                              } ${data.total}</b>
                          </td>
                      </tr>                                
                  </tbody></table>
                  
                    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px">
                      <tbody><tr><td style="background:#fbedf5;border-radius:0.6rem;color:#bc1373;padding:10px;font-weight:800;text-align:center">
                        
                          No olvides calificar a tu cliente
                        
                      </td></tr>
                    </tbody></table>
                  
                  <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px">                             
                      <tbody><tr align="right">
                          <td colspan="2"><span style="color:#000000">Que tengas un excelente día.<br><b>Atentamente</b> el Equipo de <b>Tcompra.com</b></span></td>
                      </tr>
                  </tbody></table>
              </td>
          </tr>
          <tr>
              <td align="center" style="background:#bc1373;color:#fff;padding:30px;border-radius:0 0 1rem 1rem">
                  <table style="margin-bottom:10px" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                          <td style="padding:0 3px" align="center"><a href="https://www.facebook.com/Tcompra/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/Tcompra/&amp;source=gmail&amp;ust=1731553330892000&amp;usg=AOvVaw0Zm5AMfpCEE80R6jOMkgq8"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/facebook_nmomk4.png" height="15" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0."></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.instagram.com/tcompralatam/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.instagram.com/tcompralatam/&amp;source=gmail&amp;ust=1731553330892000&amp;usg=AOvVaw2UAPGLZqQwCaNPgFXZIbsG"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/instagram_eigfod.png" height="15" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0."></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA&amp;source=gmail&amp;ust=1731553330892000&amp;usg=AOvVaw2XiNQnYNAU37FP_IbU6Yc3"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549508/youtube_t1hgc1.png" height="15" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0."></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.linkedin.com/company/tcompra" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.linkedin.com/company/tcompra&amp;source=gmail&amp;ust=1731553330892000&amp;usg=AOvVaw2ZZvOaQ1qpBR11_j0JWt73"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/linkedin_sdirhr.png" height="15" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0."></div></a></td>
                      </tr>
                  </tbody></table>
                  <table style="width:100%" cellpadding="0" cellspacing="0">
                     <tbody>
    <tr>
        <td style="width:33.33%; align-items: center;">
            <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/copyright_vdex1e.png" height="16" style="vertical-align: middle; margin-right: 5px;">
            <b style="font-weight:600;">2024 Tcompra.com</b>
        </td>
        <td style="width:33.33%; text-align: center;">
            <a href="https://tcompra.com/" style="color:#fff; text-decoration:none; align-items: center; justify-content: center;" target="_blank">
                <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/earth_dqzho0.png" height="16" style="vertical-align: middle; margin-right: 5px;">
                <b style="font-weight:600;">tcompra.com</b>
            </a>
        </td>
        <td style="width:33.33%; text-align: right;">
            <a style="text-decoration:none; align-items: center; justify-content: right;">
                <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/correo_ltrwmr.png" height="16" style="vertical-align: middle; margin-right: 5px;">
                <b style="font-weight:600; color:white;">info@tcompra.com</b>
            </a>
        </td>
    </tr>
</tbody></table>
              </td>
          </tr>
      </tbody>
  </table>

      </body>
    </html>
    `;

  return template;
};
