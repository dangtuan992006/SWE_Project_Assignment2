import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateIngredientStockDto } from './dto/update-ingredient-stock.dto';
import { CreateProductWithRecipesDto } from './dto/create-product-with-recipes.dto';
import { CancelOrderDto } from '../orders/dto/cancel-order.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { InventoryController } from './inventory.controller';

describe('Input Bounds & Validation Security (F-07)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  it('chặn UpdateIngredientStockDto khi quantity âm (không cho ADD âm trừ kho lén)', async () => {
    await expect(
      pipe.transform(
        { quantity: -50, action: 'ADD' },
        { type: 'body', metatype: UpdateIngredientStockDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+',
    'ftp://evil.example/a.png',
  ])('chặn CreateProductWithRecipesDto với imageUrl không an toàn: %s', async (badUrl) => {
    await expect(
      pipe.transform(
        {
          name: 'Test Drink',
          priceS: 30000,
          priceM: 35000,
          priceL: 40000,
          imageUrl: badUrl,
        },
        { type: 'body', metatype: CreateProductWithRecipesDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('chấp nhận CreateProductWithRecipesDto với imageUrl https / relative / data raster', async () => {
    for (const okUrl of [
      'https://images.unsplash.com/photo-1.jpg',
      '/images/coffee.webp',
      'data:image/jpeg;base64,/9j/4AAQ',
    ]) {
      await expect(
        pipe.transform(
          {
            name: 'Test Drink',
            priceS: 30000,
            priceM: 35000,
            priceL: 40000,
            imageUrl: okUrl,
          },
          { type: 'body', metatype: CreateProductWithRecipesDto },
        ),
      ).resolves.toBeInstanceOf(CreateProductWithRecipesDto);
    }
  });

  it('chặn CancelOrderDto.reason vượt quá 500 ký tự và RegisterDto vượt giới hạn bcrypt/fullName', async () => {
    await expect(
      pipe.transform(
        { reason: 'x'.repeat(501) },
        { type: 'body', metatype: CancelOrderDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pipe.transform(
        { email: 'a@b.vn', password: 'A'.repeat(73) },
        { type: 'body', metatype: RegisterDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pipe.transform(
        { email: 'a@b.vn', password: 'Password123', fullName: 'N'.repeat(121) },
        { type: 'body', metatype: RegisterDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('InventoryController.getAuditLogs chuẩn hóa tham số limit (NaN -> 100, âm -> 1, quá lớn -> 500)', async () => {
    const getAuditLogsMock = jest.fn().mockResolvedValue([]);
    const controller = new InventoryController({
      getAuditLogs: getAuditLogsMock,
    } as never);

    await controller.getAuditLogs('abc');
    expect(getAuditLogsMock).toHaveBeenLastCalledWith(100);

    await controller.getAuditLogs('-5');
    expect(getAuditLogsMock).toHaveBeenLastCalledWith(1);

    await controller.getAuditLogs('999999');
    expect(getAuditLogsMock).toHaveBeenLastCalledWith(500);
  });
});
