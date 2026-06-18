import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamLocation } from './entities/exam-location.entity';
import { CreateExamLocationDto } from './dto/create-exam-location.dto';
import { UpdateExamLocationDto } from './dto/update-exam-location.dto';

@Injectable()
export class ExamLocationsService {
  constructor(
    @InjectRepository(ExamLocation)
    private readonly examLocationRepository: Repository<ExamLocation>,
  ) {}

  async create(dto: CreateExamLocationDto): Promise<ExamLocation> {
    const location = this.examLocationRepository.create(dto);
    return await this.examLocationRepository.save(location);
  }

  async findAll(): Promise<ExamLocation[]> {
    return await this.examLocationRepository.find({
      order: { LOCATION_ID: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ExamLocation> {
    const location = await this.examLocationRepository.findOne({
      where: { LOCATION_ID: id },
      relations: ['SEATS', 'SESSION_LOCATIONS'],
    });

    if (!location) {
      throw new NotFoundException(`Exam Location with ID ${id} not found`);
    }

    return location;
  }

  async update(id: number, dto: UpdateExamLocationDto): Promise<ExamLocation> {
    const location = await this.findOne(id);
    const updated = this.examLocationRepository.merge(location, dto);
    return await this.examLocationRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await this.examLocationRepository.softRemove(location);
  }
}
