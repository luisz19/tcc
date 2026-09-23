import { Expose } from 'class-transformer';

export class LoginResponse {
  constructor(private readonly partial?: Partial<LoginResponse>) {
    //optional parameter to allow partial initialization
    Object.assign(this, partial); // assign the properties of the partial object to the instance of LoginResponse
  }

  @Expose()
  accessToken: string;
}
