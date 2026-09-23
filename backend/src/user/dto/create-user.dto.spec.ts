import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  // agrupa os testes relacionados ao CreateUserDto

  let dto = new CreateUserDto();

  beforeEach(() => {
    //executa antes de cada teste
    dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = '123456A#';
  });

  it('should validate complete valid data', async () => {
    //representa um cenário
    const errors = await validate(dto); //percorre todos os decorators do CreateUserDto e retorna um array de erros, caso haja algum

    expect(errors.length).toBe(0);
  });

  it('should fail on invalid email', async () => {
    // Arrange
    dto.email = 'test';
    // Act
    const errors = await validate(dto);
    // Assert
    // console.log(errors);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  const testPassword = async (password: string, message: string) => {
    dto.password = password;
    const errors = await validate(dto);
    const passwordError = errors.find((error) => error.property === 'password');
    expect(passwordError).not.toBeUndefined();
    const messages = Object.values(passwordError?.constraints ?? {});
    expect(messages).toContain(message);
  };

  // 1) At least 1 uppercase letter
  // 2) At least 1 number
  // 3) At least 1 special character
  it('should fail without 1 uppercase letter', async () => {
    await testPassword(
      'abcdef',
      'Password must contain at least 1 uppercase letter',
    );
  });

  it('should fail without at least 1 number', async () => {
    await testPassword('abdefaA', 'Password must contain at least 1 number');
  });

  it('should fail without at least 1 special character', async () => {
    await testPassword(
      'abdefaA1',
      'Password must contain at least 1 special character',
    );
  });
});
