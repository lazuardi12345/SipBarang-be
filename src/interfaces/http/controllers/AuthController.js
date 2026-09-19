export class AuthController {
  constructor(registerUseCase, loginUseCase, getProfileUseCase) {
    this.registerUseCase = registerUseCase;
    this.loginUseCase = loginUseCase;
    this.getProfileUseCase = getProfileUseCase;
  }

  register = async (req, res, next) => {
    try {
      const user = await this.registerUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        message: "Registrasi berhasil",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req, res, next) => {
    try {
      const user = await this.getProfileUseCase.execute(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
}
