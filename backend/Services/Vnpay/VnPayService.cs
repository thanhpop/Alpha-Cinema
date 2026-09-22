using backend.Libraries;
using backend.Helpers;
using backend.Model.Vnpay;

namespace backend.Service.Vnpay
{
    public class VnPayService : IVnPayService
    {
        private readonly IConfiguration _configuration;
        public VnPayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context)
        {
            var timeNow = DateTimeHelper.Now;

            var pay = new VnPayLibrary();
            var urlCallBack = Environment.GetEnvironmentVariable("VNPAY_RETURN_URL");
            var tmnCode = Environment.GetEnvironmentVariable("VNPAY_TMN_CODE");
            var hashSecret = Environment.GetEnvironmentVariable("VNPAY_HASH_SECRET");



            pay.AddRequestData("vnp_Version", _configuration["Vnpay:Version"]);
            pay.AddRequestData("vnp_Command", _configuration["Vnpay:Command"]);
            pay.AddRequestData("vnp_TmnCode", tmnCode);
            pay.AddRequestData("vnp_Amount", ((int)model.Amount * 100).ToString());
            pay.AddRequestData("vnp_BankCode", "NCB");
            pay.AddRequestData("vnp_CreateDate", timeNow.ToString("yyyyMMddHHmmss"));
            pay.AddRequestData("vnp_CurrCode", _configuration["Vnpay:CurrCode"]);
            pay.AddRequestData("vnp_IpAddr", pay.GetIpAddress(context));
            pay.AddRequestData("vnp_Locale", _configuration["Vnpay:Locale"]);

            pay.AddRequestData($"vnp_OrderInfo", $"Thanh toan don - ReservationId: {model.ReservationId}");

            pay.AddRequestData("vnp_OrderType", "other");

            pay.AddRequestData("vnp_ReturnUrl", urlCallBack);


            pay.AddRequestData("vnp_TxnRef", model.ReservationId);

            var paymentUrl = pay.CreateRequestUrl(
                _configuration["Vnpay:BaseUrl"],
                hashSecret
            );

            return paymentUrl;
        }
        public PaymentResponseModel PaymentExecute(IQueryCollection collections)
        {
            var pay = new VnPayLibrary();
            var response = pay.GetFullResponseData(collections, _configuration["Vnpay:HashSecret"]);

            return response;
        }



    }
}
